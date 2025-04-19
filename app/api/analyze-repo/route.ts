import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Function to recursively scan a directory and build a file tree
async function scanDirectory(dir: string, baseDir: string): Promise<any[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result = await Promise.all(
      entries
        .filter(entry => !entry.name.startsWith('.') && entry.name !== 'node_modules')
        .map(async entry => {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(baseDir, fullPath);
          
          if (entry.isDirectory()) {
            const children = await scanDirectory(fullPath, baseDir);
            return {
              name: entry.name,
              type: 'directory',
              path: relativePath,
              children
            };
          } else {
            return {
              name: entry.name,
              type: 'file',
              path: relativePath
            };
          }
        })
    );
    
    return result;
  } catch (error) {
    console.error('Error scanning directory:', error);
    return [];
  }
}

// Extract imports from JavaScript/TypeScript files
async function extractImports(filePath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    
    const imports: string[] = [];
    let match;
    
    // Regular imports
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Dynamic imports
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (error) {
    console.error(`Error extracting imports from ${filePath}:`, error);
    return [];
  }
}

// Analyze a file to build dependency information
async function analyzeFile(filePath: string, repoPath: string): Promise<any> {
  // Only analyze JavaScript/TypeScript files
  if (!/\.(js|jsx|ts|tsx)$/.test(filePath)) {
    return null;
  }
  
  try {
    const fullPath = path.join(repoPath, filePath);
    const imports = await extractImports(fullPath);
    
    return {
      file: filePath,
      imports
    };
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return null;
  }
}

// Build dependency graph from all files
async function buildDependencyGraph(fileStructure: any[], repoPath: string): Promise<any> {
  const graph: Record<string, string[]> = {};
  const filesToAnalyze: string[] = [];
  
  // Flat list of files from file structure
  function extractFiles(items: any[], result: string[] = []) {
    items.forEach(item => {
      if (item.type === 'file' && /\.(js|jsx|ts|tsx)$/.test(item.path)) {
        result.push(item.path);
      } else if (item.type === 'directory' && item.children) {
        extractFiles(item.children, result);
      }
    });
    return result;
  }
  
  filesToAnalyze.push(...extractFiles(fileStructure));
  
  // Analyze each file
  const analysisResults = await Promise.all(
    filesToAnalyze.map(file => analyzeFile(file, repoPath))
  );
  
  // Build the graph
  analysisResults.filter(Boolean).forEach(result => {
    if (result) {
      graph[result.file] = result.imports;
    }
  });
  
  return {
    nodes: Object.keys(graph).map(file => ({ id: file, label: file })),
    edges: Object.entries(graph).flatMap(([file, imports]) => 
      imports.map(imp => ({ 
        source: file, 
        target: resolveImportPath(file, imp, filesToAnalyze),
        type: 'imports' 
      }))
    ).filter(edge => edge.target) // Filter out edges with undefined targets
  };
}

// Resolve relative import paths to absolute paths
function resolveImportPath(sourcePath: string, importPath: string, availableFiles: string[]): string | undefined {
  // Handle package imports (not local files)
  if (importPath.startsWith('@') || !importPath.startsWith('.')) {
    return undefined;
  }
  
  const sourceDir = path.dirname(sourcePath);
  let resolvedPath = path.join(sourceDir, importPath);
  
  // Try to match with available files
  const exactMatch = availableFiles.find(file => file === resolvedPath);
  if (exactMatch) return exactMatch;
  
  // Try with extensions
  for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
    const withExt = resolvedPath + ext;
    const match = availableFiles.find(file => file === withExt);
    if (match) return match;
  }
  
  // Try with /index.* files
  for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
    const withIndex = path.join(resolvedPath, `index${ext}`);
    const match = availableFiles.find(file => file === withIndex);
    if (match) return match;
  }
  
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { repositoryPath } = await request.json();
    
    // Validate the repository path
    try {
      const stats = await fs.stat(repositoryPath);
      if (!stats.isDirectory()) {
        return NextResponse.json({ error: 'The provided path is not a directory' }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid repository path' }, { status: 400 });
    }
    
    // Scan the directory to build file structure
    const fileStructure = await scanDirectory(repositoryPath, repositoryPath);
    
    // Build dependency graph
    const dependencyGraph = await buildDependencyGraph(fileStructure, repositoryPath);
    
    return NextResponse.json({
      success: true,
      fileStructure,
      dependencyGraph,
      summary: {
        totalFiles: dependencyGraph.nodes.length,
        totalDependencies: dependencyGraph.edges.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return NextResponse.json({ error: 'Failed to analyze repository' }, { status: 500 });
  }
} 