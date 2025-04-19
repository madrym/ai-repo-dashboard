#!/usr/bin/env node

// This script creates a test repository structure for debugging and testing
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const owner = 'test-org';
const repo = 'test-repo';
const branch = 'main';

// Base paths
const storageDir = path.join(process.cwd(), 'storage', 'repos');
const repoDir = path.join(storageDir, owner, repo);
const branchDir = path.join(repoDir, branch);
const codeDir = path.join(branchDir, 'code');
const specsDir = path.join(branchDir, 'specs');

// Create directory structure
console.log('Creating directory structure...');
fs.mkdirSync(path.join(storageDir, owner, repo, branch, 'code'), { recursive: true });
fs.mkdirSync(path.join(specsDir, 'spec-test'), { recursive: true });

// Create sample files
console.log('Creating sample files...');

// Create a basic README in the code directory
const readmeContent = `# Test Repository
This is a test repository for debugging and testing purposes.

## Features
- Feature 1
- Feature 2
`;
fs.writeFileSync(path.join(codeDir, 'README.md'), readmeContent);

// Create a sample code file
const indexContent = `function hello() {
  console.log('Hello, world!');
}

hello();
`;
fs.writeFileSync(path.join(codeDir, 'index.js'), indexContent);

// Create a PLANNING.md in the specs directory
const planningContent = `# 📝 Test Feature

## 📋 Overview
This is a test feature for demonstration purposes.

## 🏗️ Architecture

### Components

1. **Component One** - Does something important
2. **Component Two** - Another critical component

### Technical Stack
- Node.js
- React
`;
fs.writeFileSync(path.join(specsDir, 'spec-test', 'PLANNING.md'), planningContent);

// Create a sample repomix-summary.xml
const repomixContent = `<?xml version="1.0" encoding="UTF-8"?>
<repomix>
  <file_summary>
    <purpose>
      This is a test repository for the AI Repository Dashboard.
    </purpose>
    <file_format>
      Standard format with files and directories.
    </file_format>
  </file_summary>
  <directory_structure>
    index.js
    README.md
    src/
    src/components/
    src/utils/
    tests/
  </directory_structure>
  <files>
    <file path="README.md">
      # Test Repository
      This is a test repository for debugging and testing purposes.
    </file>
    <file path=".ai/repository-spec.md">
      # 🧾 Repository Specification: Test Repository
      
      ## 📘 Repository Overview  
      - **Summary**:  
        A test repository for demonstration purposes with sample code and structure.
      
      - **Core Features**:  
        - **Feature Planning** — Create feature specs
        - **Code Management** — Browse and edit code
        - **Analytics** — View repository statistics
      
      ## 🛠️ Languages & Versions  
      - **Languages**:  
        - JavaScript (primary)
        - TypeScript
        - CSS
      
      - **Language Versions**:  
        - Node.js v16
    </file>
  </files>
</repomix>
`;
fs.writeFileSync(path.join(branchDir, 'repomix-summary.xml'), repomixContent);

console.log('Test repository structure created successfully!');
console.log(`Path: ${branchDir}`);
console.log('Run the following to test the API:');
console.log(`curl "http://localhost:3000/api/repositories/debug?owner=${owner}&repo=${repo}&branch=${branch}"`);
console.log(`curl -X POST -H "Content-Type: application/json" -d '{"owner":"${owner}","repo":"${repo}","branch":"${branch}"}' http://localhost:3000/api/repositories/repomix-summary`); 