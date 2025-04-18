interface RepoSummaryProps {
  summary: string
}

export function RepoSummary({ summary }: RepoSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <h3 className="text-lg font-medium">Repository Overview</h3>
        <p className="mt-2 text-muted-foreground">{summary}</p>
      </div>

      <div className="rounded-md border p-4">
        <h3 className="text-lg font-medium">Key Features</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Repository dashboard with AI-powered insights</li>
          <li>Feature planner with AI assistance</li>
          <li>File explorer with syntax highlighting</li>
          <li>GitHub integration for creating branches and PRs</li>
        </ul>
      </div>

      <div className="rounded-md border p-4">
        <h3 className="text-lg font-medium">Architecture</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Next.js App Router for frontend</li>
          <li>GitHub App authentication</li>
          <li>Monaco editor for code viewing and editing</li>
          <li>AI-powered analysis and planning</li>
        </ul>
      </div>
    </div>
  )
}
