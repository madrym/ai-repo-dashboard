# Local Repository Clone Storage Feature

This feature enhances the GitHub repository dashboard by cloning repositories locally instead of relying solely on the GitHub API. This improves performance, allows offline access to repositories, and enables direct file system operations.

## Features

- **Local Repository Cloning**: Automatically clones GitHub repositories to the local file system when connecting
- **Real File Browsing**: Shows actual files from the cloned repository instead of mocked content
- **Improved Performance**: Faster file access and browsing without API rate limiting
- **Local/Remote Indicator**: Shows whether a repository is available locally or remote-only
- **Automatic Updates**: Pulls the latest changes when reconnecting to a previously cloned repository

## Technical Implementation

- Local repositories are stored in the `/storage/repos/{owner}/{repo}` directory
- Server-side API routes handle cloning, updating, and accessing local repositories
- Implements graceful fallback to GitHub API when local cloning fails
- Optimized file tree generation that skips `.git` and `node_modules` directories

## API Endpoints

1. **Clone Repository**: `POST /api/repositories/clone`
   - Clones a GitHub repository locally
   - Returns the local path and repository information

2. **Local File Content**: `POST /api/repositories/local-file`
   - Retrieves file content from a locally cloned repository
   - Returns the file content and metadata

3. **Local Repository Structure**: `POST /api/repositories/local-structure`
   - Gets the file structure of a locally cloned repository
   - Returns a hierarchical tree of files and directories

## Usage

When connecting to a repository, the system will automatically attempt to clone it locally.
The dashboard will display an indicator showing whether the repository is available locally.

## Security

- Implements path traversal protection to prevent accessing files outside the repository directory
- Repository storage is excluded from Git to prevent large files from being committed 