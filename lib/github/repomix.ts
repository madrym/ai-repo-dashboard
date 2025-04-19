/**
 * Client-friendly interface for the repomix functionality.
 * The actual file parsing happens on the server via API routes.
 */

// Interface for repomix summary data
export interface RepomixSummary {
  overview?: string;
  aiAnalysis?: string;
  features?: string[];
  architecture?: string[];
  languages?: { name: string; percentage: number }[];
  statistics?: any;
  file_count?: number;
  directory_count?: number;
  key_files?: string[];
} 