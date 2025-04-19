import fs from 'fs';
import path from 'path';
import { decode } from 'html-entities';
import { RepomixSummary } from '@/lib/github/repomix';
import {
  getRepomixOutputPath,
  getRepoCodeDir
} from '@/lib/services/repomix-generator';

// Import DOMParser with a try/catch to handle cases where it's not installed
let DOMParser: any;
try {
  const xmldom = require('xmldom');
  DOMParser = xmldom.DOMParser;
} catch (error) {
  console.warn('xmldom not installed, XML parsing will fail');
  DOMParser = class {
    parseFromString() {
      throw new Error('xmldom not installed. Run "pnpm add xmldom html-entities" to install required dependencies.');
    }
  };
}

/**
 * Get the path to the repomix output file for a repository
 */
export function getRepomixSummaryPath(owner: string, repo: string, branch = 'main'): string {
  return getRepomixOutputPath(owner, repo, branch);
}

/**
 * Get the path to the code directory for a repository
 */
export function getCodePath(owner: string, repo: string, branch = 'main'): string {
  return getRepoCodeDir(owner, repo, branch);
}

/**
 * Check if a repomix output file exists for a repository
 */
export function repomixSummaryExists(owner: string, repo: string, branch = 'main'): boolean {
  const outputPath = getRepomixSummaryPath(owner, repo, branch);
  return fs.existsSync(outputPath);
}

/**
 * Parse a repomix summary file and extract repository data
 */
export function parseRepomixSummary(owner: string, repo: string, branch = 'main'): RepomixSummary | null {
  try {
    const summaryPath = getRepomixSummaryPath(owner, repo, branch);
    
    if (!fs.existsSync(summaryPath)) {
      console.warn(`No repomix summary found at ${summaryPath}`);
      return null;
    }
    
    // Read the file content
    const content = fs.readFileSync(summaryPath, 'utf-8');
    
    // Parse the XML document
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Helper function to get text content from an element safely
    const getTextContent = (element: Element | null): string => {
      return element && element.textContent ? element.textContent.trim() : '';
    };
    
    // Helper function to find multiple elements and extract their text
    const getElementsText = (selector: string): string[] => {
      const result: string[] = [];
      const elements = xmlDoc.getElementsByTagName(selector);
      for (let i = 0; i < elements.length; i++) {
        const text = getTextContent(elements[i]);
        if (text) result.push(text);
      }
      return result;
    };
    
    // Extract overview from purpose element
    const purposeElements = xmlDoc.getElementsByTagName('purpose');
    const overview = purposeElements.length > 0 ? getTextContent(purposeElements[0]) : '';
    
    // Find all file elements for key files
    const fileElements = xmlDoc.getElementsByTagName('file');
    const keyFiles: string[] = [];
    for (let i = 0; i < fileElements.length; i++) {
      const filePath = fileElements[i].getAttribute('path');
      if (filePath) {
        keyFiles.push(filePath);
      }
    }
    
    // Find files and directories count from directory_structure
    const directoryStructure = xmlDoc.getElementsByTagName('directory_structure')[0];
    let fileCount = 0;
    let directoryCount = 0;
    
    if (directoryStructure && directoryStructure.textContent) {
      const lines = directoryStructure.textContent.split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      
      fileCount = lines.filter(line => !line.endsWith('/')).length;
      directoryCount = lines.filter(line => line.endsWith('/')).length;
    }
    
    // Look for repository-spec.md file for additional info
    let features: string[] = [];
    let architecture: string[] = [];
    
    for (let i = 0; i < fileElements.length; i++) {
      const filePath = fileElements[i].getAttribute('path');
      if (filePath && filePath.includes('repository-spec.md')) {
        const content = getTextContent(fileElements[i]);
        
        // Extract features
        const featuresMatch = content.match(/Core Features\*\*:([\s\S]+?)(?=##|\n\n)/);
        if (featuresMatch && featuresMatch[1]) {
          features = featuresMatch[1]
            .split('\n')
            .filter(line => line.includes('**'))
            .map(line => {
              const match = line.match(/- \*\*(.+?)\*\* — (.+)/);
              return match ? `${match[1]}: ${match[2]}` : line.trim();
            })
            .filter(Boolean);
        }
        
        // Extract languages
        const languagesMatch = content.match(/Languages\*\*:([\s\S]+?)(?=Language Versions)/);
        const languageLines = languagesMatch ? languagesMatch[1].split('\n').filter((line: string) => line.includes('-')) : [];
        
        const languages = languageLines.map((line: string, index: number) => {
          const name = line.replace(/[\s-]*([\w#]+).*/, '$1').trim();
          // Create mock percentages (descending)
          const percentage = Math.max(10, 100 - (index * 20));
          return { name, percentage };
        });
        
        return {
          overview,
          features,
          architecture,
          languages,
          file_count: fileCount,
          directory_count: directoryCount,
          key_files: keyFiles
        };
      }
    }
    
    // Default return if no repository-spec.md found
    return {
      overview,
      features,
      architecture,
      languages: [],
      file_count: fileCount, 
      directory_count: directoryCount,
      key_files: keyFiles
    };
    
  } catch (error) {
    console.error('Error parsing repomix summary:', error);
    return null;
  }
}

/**
 * Helper function to find repository overview from the content
 * @param content The XML content string
 * @returns The repository overview
 */
function findRepositoryOverview(content: string): string {
  // Look for overview in XML repository spec
  const overviewMatch = content.match(/## 📘 Repository Overview\s+- \*\*Summary\*\*:\s+([\s\S]+?)(?=-)/);
  if (overviewMatch && overviewMatch[1]) {
    return decode(overviewMatch[1].trim());
  }
  
  // Look for overview in file_summary purpose
  const purposeMatch = content.match(/<purpose>([\s\S]+?)<\/purpose>/);
  if (purposeMatch && purposeMatch[1]) {
    return decode(purposeMatch[1].trim());
  }
  
  return "No overview available";
}

/**
 * Helper function to find core features from the content
 * @param content The XML content string
 * @returns Array of core features
 */
function findCoreFeatures(content: string): string[] {
  // Look for features in repository spec
  const featuresMatch = content.match(/- \*\*Core Features\*\*:\s+([\s\S]+?)(?=---)/);
  if (featuresMatch && featuresMatch[1]) {
    return featuresMatch[1]
      .split('\n')
      .filter(line => line.includes('**'))
      .map(line => {
        const match = line.match(/- \*\*(.+?)\*\* — (.+)/);
        return match ? `${match[1]}: ${match[2]}` : line.trim();
      })
      .filter(Boolean);
  }
  
  return [];
}

/**
 * Helper function to find architecture from the content
 * @param content The XML content string
 * @returns Array of architecture components
 */
function findArchitecture(content: string): string[] {
  // Look for architecture in planning docs
  const architectureMatch = content.match(/## 🏗️ Architecture([\s\S]+?)(?=##)/);
  if (architectureMatch && architectureMatch[1]) {
    return architectureMatch[1]
      .split('\n')
      .filter(line => line.includes('**'))
      .map(line => line.trim().replace(/^\d+\.\s+\*\*/, '').replace(/\*\*\s+[-—]/, ':'));
  }
  
  return [];
}

/**
 * Helper function to find key files in the XML document
 */
function findKeyFiles(xmlDoc: Document): string[] {
  const keyFiles: string[] = [];
  
  // Extract all file nodes
  const fileNodes = xmlDoc.getElementsByTagName('file');
  
  for (let i = 0; i < fileNodes.length; i++) {
    const path = fileNodes[i].getAttribute('path');
    if (path) {
      keyFiles.push(path);
    }
    
    // Limit to 20 key files
    if (keyFiles.length >= 20) {
      break;
    }
  }
  
  return keyFiles;
}

/**
 * Find a file node in the XML document by path
 */
function findFileNode(xmlDoc: Document, filePath: string): Element | null {
  const fileNodes = xmlDoc.getElementsByTagName('file');
  
  for (let i = 0; i < fileNodes.length; i++) {
    const node = fileNodes[i];
    const path = node.getAttribute('path');
    
    if (path === filePath) {
      return node;
    }
  }
  
  return null;
}

/**
 * Get the list of files from a repomix summary
 * @param owner Repository owner
 * @param repo Repository name
 * @param branch Repository branch
 * @returns Array of file paths
 */
export function getRepomixFileList(owner: string, repo: string, branch = 'main'): string[] {
  try {
    // Get the summary path
    const summaryPath = getRepomixSummaryPath(owner, repo, branch);
    
    // Check if the file exists
    if (!fs.existsSync(summaryPath)) {
      return [];
    }
    
    // Read the file content
    const content = fs.readFileSync(summaryPath, 'utf-8');
    
    // Parse the XML document
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Find all file nodes in the document
    const fileNodes = xmlDoc.getElementsByTagName('file');
    
    // Extract the file paths
    const filePaths: string[] = [];
    for (let i = 0; i < fileNodes.length; i++) {
      const path = fileNodes[i].getAttribute('path');
      if (path) {
        filePaths.push(path);
      }
    }
    
    return filePaths;
  } catch (error) {
    console.error('Error getting file list from repomix summary:', error);
    return [];
  }
} 