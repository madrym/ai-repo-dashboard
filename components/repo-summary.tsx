interface RepoSummaryProps {
  summary?: string;
  repository?: any;
  repomixSummary?: {
    overview?: string;
    aiAnalysis?: string;
    features?: string[];
    architecture?: string[];
    languages?: { name: string; percentage: number }[];
    statistics?: any;
    file_count?: number;
    directory_count?: number;
    key_files?: string[];
  };
  onSelectFile?: (path: string) => void;
  onRefreshSummary?: () => void;
}

export function RepoSummary({ 
  summary, 
  repository, 
  repomixSummary, 
  onSelectFile,
  onRefreshSummary
}: RepoSummaryProps) {
  // Use repository summary if available, otherwise use provided summary
  const displaySummary = 
    repomixSummary?.overview || 
    repository?.summary || 
    summary || 
    "No repository summary available.";
  
  // Use features from repomix or fallback to default
  const features = repomixSummary?.features || [
    "Repository dashboard with AI-powered insights",
    "Feature planner with AI assistance",
    "File explorer with syntax highlighting",
    "GitHub integration for creating branches and PRs",
  ];
  
  // Use architecture from repomix or fallback to default
  const architecture = repomixSummary?.architecture || [
    "Next.js App Router for frontend",
    "GitHub App authentication",
    "Monaco editor for code viewing and editing",
    "AI-powered analysis and planning",
  ];

  // Check if we have detailed AI analysis
  const hasAiAnalysis = repomixSummary?.aiAnalysis && repomixSummary.aiAnalysis.length > 0;

  // Compute key files to display
  const keyFiles = repomixSummary?.key_files?.slice(0, 10) || [];
  const hasKeyFiles = keyFiles.length > 0;
  
  // Handle file selection
  const handleFileClick = (path: string) => {
    if (onSelectFile) {
      onSelectFile(path);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-medium">Repository Overview</h3>
          {onRefreshSummary && (
            <button 
              onClick={onRefreshSummary}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Regenerate repository summary"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-muted-foreground"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-2 text-muted-foreground">{displaySummary}</p>
      </div>

      {hasAiAnalysis && (
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium">AI Analysis</h3>
          <p className="mt-2 text-muted-foreground whitespace-pre-line">{repomixSummary?.aiAnalysis}</p>
        </div>
      )}

      <div className="rounded-md border p-4">
        <h3 className="text-lg font-medium">Key Features</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border p-4">
        <h3 className="text-lg font-medium">Architecture</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          {architecture.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {hasKeyFiles && (
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium">Key Files</h3>
          <ul className="mt-2 list-inside space-y-1 text-muted-foreground">
            {keyFiles.map((file, index) => (
              <li key={index} className="flex items-center">
                <button 
                  onClick={() => handleFileClick(file)}
                  className="text-left hover:text-blue-500 hover:underline focus:outline-none"
                >
                  {file}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {repomixSummary?.languages && repomixSummary.languages.length > 0 && (
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium">Languages</h3>
          <div className="mt-2 space-y-2">
            {repomixSummary.languages.map((language) => (
              <div key={language.name} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{language.name}</span>
                  <span>{language.percentage}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${language.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {repomixSummary?.file_count && repomixSummary?.directory_count && (
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium">Statistics</h3>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Files</p>
              <p className="text-2xl font-semibold">{repomixSummary.file_count}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Directories</p>
              <p className="text-2xl font-semibold">{repomixSummary.directory_count}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
