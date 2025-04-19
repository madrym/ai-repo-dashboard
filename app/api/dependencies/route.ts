import { NextResponse } from 'next/server';
// Remove direct dependency-cruiser import
// import { cruise, type IModule } from 'dependency-cruiser'; 
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'; // Import specific type

interface DependencyNode {
  id: string; // Typically the file path
  label: string; // Display label, could be file name
}

interface DependencyEdge {
  source: string; // Source file path
  target: string; // Target file path
  type: string; // e.g., 'dependency', 'devDependency', 'core', 'internal'
}

interface DependencyGraphData {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

// Type for file structure items
interface FileStructureItem {
  name: string;
  type: 'directory' | 'file';
  path: string; // Relative path from repoRoot
  children?: FileStructureItem[];
}

// Function to recursively get directory structure
function getDirectoryStructure(dirPath: string, rootPath: string = dirPath): FileStructureItem[] {
  const structure: FileStructureItem[] = [];
  try {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      // Skip hidden files/folders like .git
      if (item.startsWith('.')) return;
      
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(rootPath, fullPath);
      try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            // Skip node_modules
            if (item === 'node_modules') return;
            structure.push({
              name: item,
              type: 'directory',
              path: relativePath,
              children: getDirectoryStructure(fullPath, rootPath),
            });
          } else {
            structure.push({ name: item, type: 'file', path: relativePath });
          }
      } catch (statError) {
         // Add type check for error
         const message = statError instanceof Error ? statError.message : String(statError);
         console.warn(`Could not get stats for ${fullPath}: ${message}`);
      }
    });
  } catch (readError) {
     // Add type check for error
     const message = readError instanceof Error ? readError.message : String(readError);
     console.error(`Could not read directory ${dirPath}: ${message}`);
     // Return empty array or throw, depending on desired behavior
  }
  // Sort directories first, then files, alphabetically
  structure.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
  return structure;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const org = searchParams.get('org');
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch');

  if (!org || !repo || !branch) {
    return NextResponse.json({ error: 'org, repo, and branch parameters are required' }, { status: 400 });
  }

  // --- Construct path relative to project root --- 
  const relativeRepoPath = path.join('storage', 'repos', org, repo, branch, 'code');
  // Use process.cwd() to get the project's root directory on the server
  const repoRoot = path.resolve(process.cwd(), relativeRepoPath);
  // --- End path construction --- 

  // Check if the directory exists
  if (!fs.existsSync(repoRoot)) {
      console.error(`Repository directory not found at resolved path: ${repoRoot}`);
      // Add context about the relative path attempted
      return NextResponse.json({ 
          error: `Repository directory not found on server.`,
          details: `Attempted path: ${relativeRepoPath} (relative to project root)`
      }, { status: 404 });
  }

  // --- Adjust output directory path similarly --- 
  const relativeOutputDir = path.join('storage', 'repos', org, repo, branch, 'dependencies');
  const outputDir = path.resolve(process.cwd(), relativeOutputDir);
  const outputFilePath = path.join(outputDir, 'dependency-graph.json');
  // --- End output dir adjustment --- 

  console.log(`Analyzing dependencies and structure for: ${repoRoot}`);

  try {
    // Use a Promise to handle the asynchronous child process
    const cruiseResultJson = await new Promise<string>((resolve, reject) => {
      const command = 'npx';
      const args = [
        'depcruise',
        '--include-only', '.',
        '--exclude', 'node_modules|\.git|dist|build',
        '--output-type', 'json',
        '--max-depth', '0',
        '--no-config',
        repoRoot 
      ];

      console.log(`Executing: ${command} ${args.join(' ')}`);

      // Ensure the child process runs within the target repository directory
      // Remove shell: true to avoid shell metacharacter issues with arguments
      const depProcess: ChildProcessWithoutNullStreams = spawn(command, args, {
        cwd: repoRoot, 
        // shell: true, 
        env: { ...process.env, NODE_OPTIONS: '' } // Avoid potential NODE_OPTIONS conflicts
      });

      let stdoutData = '';
      let stderrData = '';

      // Add types for data parameters
      depProcess.stdout.on('data', (data: Buffer | string) => { stdoutData += data.toString(); });
      depProcess.stderr.on('data', (data: Buffer | string) => { stderrData += data.toString(); });

      // Add type for code parameter
      depProcess.on('close', (code: number | null) => {
        if (code === 0) {
          console.log('depcruise CLI finished successfully.');
          const jsonMatch = stdoutData.match(/{\s*"modules":\s*\[/);
          if (jsonMatch && jsonMatch.index !== undefined) { // Check index is not undefined
             resolve(stdoutData.substring(jsonMatch.index));
          } else {
             console.error("Could not find valid JSON start in depcruise output.");
             console.error("stdout:", stdoutData);
             reject(new Error("Invalid output format from dependency analysis CLI."));
          }
        } else {
          // Handle potential null exit code
          const exitCode = code ?? 'unknown'; 
          console.error(`depcruise CLI exited with code ${exitCode}`);
          console.error('stderr:', stderrData);
          reject(new Error(`Dependency analysis failed (exit code ${exitCode}): ${stderrData.substring(0, 500)}`)); 
        }
      });

      // Add type for err parameter
      depProcess.on('error', (err: Error) => {
        console.error('Failed to start depcruise process:', err);
        reject(new Error(`Failed to start dependency analysis process: ${err.message}`));
      });
    });

    // --- Save the raw JSON output --- 
    try {
        console.log(`Ensuring output directory exists: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true }); // Create directory if it doesn't exist

        console.log(`Saving dependency analysis JSON to: ${outputFilePath}`);
        fs.writeFileSync(outputFilePath, cruiseResultJson); // Write the raw JSON string
        console.log(`Successfully saved dependency graph JSON.`);
    } catch (writeError) {
        const message = writeError instanceof Error ? writeError.message : String(writeError);
        console.error(`Failed to save dependency graph JSON to ${outputFilePath}:`, message);
        // Continue processing despite save error
    }
    // --- End saving --- 

    // Parse the JSON output from stdout
    let analysisResult;
    try {
        analysisResult = JSON.parse(cruiseResultJson);
    } catch (parseError) {
        console.error("Failed to parse depcruise JSON output:", parseError);
        console.error("Raw output snippet:", cruiseResultJson.substring(0, 1000));
        throw new Error("Failed to parse dependency analysis output.");
    }

    if (!analysisResult || !Array.isArray(analysisResult.modules)) {
        console.error("Parsed depcruise output is missing 'modules' array:", analysisResult);
        throw new Error("Invalid dependency analysis output format.");
    }

    const modules: any[] = analysisResult.modules;

    // Transform the result
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const addedNodeIds = new Set<string>();

    modules.forEach(module => {
        const nodeId = module.source;
        if (!addedNodeIds.has(nodeId)) {
            nodes.push({ id: nodeId, label: path.basename(nodeId) });
            addedNodeIds.add(nodeId);
        }
        module.dependencies?.forEach((dep: any) => { // Check if dependencies array exists
            const targetId = dep.resolved;
            if (targetId) { // Process only if dependency was resolved
                if (!addedNodeIds.has(targetId)) {
                     nodes.push({ id: targetId, label: path.basename(targetId) });
                     addedNodeIds.add(targetId);
                }
                edges.push({
                  source: nodeId,
                  target: targetId,
                  type: dep.dependencyTypes?.[0] || (dep.coreModule ? 'core' : (dep.couldNotResolve ? 'unresolved' : 'internal')),
                });
            }
        });
    });

    const graphData: DependencyGraphData = { nodes, edges };
    console.log(`Dependency analysis complete via CLI. Found ${nodes.length} nodes and ${edges.length} edges.`);

    // --- Get the file structure --- 
    console.log("Getting file structure...");
    const fileStructure = getDirectoryStructure(repoRoot);
    console.log(`Found ${fileStructure.length} top-level items in file structure.`);
    // --- End file structure --- 

    console.log(`Analysis complete. Found ${nodes.length} nodes, ${edges.length} edges.`);
    // Return both graph data and file structure
    return NextResponse.json({ graphData, fileStructure });

  } catch (error) {
     console.error('Analysis process failed:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     // Ensure error response structure is consistent
     return NextResponse.json({ error: 'Failed to run analysis', details: errorMessage }, { status: 500 });
  }
} 