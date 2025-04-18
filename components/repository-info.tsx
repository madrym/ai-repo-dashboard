import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart3, GitBranch, Users, Code, GitPullRequest, Activity } from "lucide-react";
import { Repository, Branch, Contributor } from '@/lib/github';

interface RepositoryInfoProps {
  repository: Repository;
  branches: Branch[];
  contributors: Contributor[];
  languages: Record<string, number>;
  pullRequests?: any[];
  commitActivity?: any;
  codeFrequency?: any;
  participation?: any;
}

export function RepositoryInfo({ 
  repository, 
  branches, 
  contributors, 
  languages,
  pullRequests,
  commitActivity,
  codeFrequency,
  participation
}: RepositoryInfoProps) {
  // Calculate total language bytes for percentage calculation
  const totalLanguageBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  
  // Convert languages to array with percentages for display
  const languageArray = Object.entries(languages).map(([name, bytes]) => ({
    name,
    bytes,
    percentage: Math.round((bytes / totalLanguageBytes) * 100),
  })).sort((a, b) => b.bytes - a.bytes);
  
  // Format commit activity data for display if available
  const hasCommitActivity = commitActivity && Array.isArray(commitActivity) && commitActivity.length > 0;
  const lastFourWeeksActivity = hasCommitActivity ? commitActivity.slice(-4) : [];
  
  // Format pull request data for display if available
  const hasPullRequests = pullRequests && Array.isArray(pullRequests);
  const openPullRequests = hasPullRequests ? pullRequests.slice(0, 5) : [];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{repository.full_name}</CardTitle>
            <CardDescription>{repository.description || 'No description provided'}</CardDescription>
          </div>
          <Badge variant={repository.private ? "destructive" : "outline"}>
            {repository.private ? 'Private' : 'Public'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="branches">
              <GitBranch className="mr-2 h-4 w-4" />
              Branches ({branches.length})
            </TabsTrigger>
            <TabsTrigger value="contributors">
              <Users className="mr-2 h-4 w-4" />
              Contributors ({contributors.length})
            </TabsTrigger>
            <TabsTrigger value="languages">
              <Code className="mr-2 h-4 w-4" />
              Languages
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="pullrequests">
              <GitPullRequest className="mr-2 h-4 w-4" />
              PRs {hasPullRequests && `(${pullRequests.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Repository Details</h3>
                <div className="rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Stars</div>
                    <div>{repository.stargazers_count}</div>
                    <div className="font-medium">Forks</div>
                    <div>{repository.forks_count}</div>
                    <div className="font-medium">Open Issues</div>
                    <div>{repository.open_issues_count}</div>
                    <div className="font-medium">Default Branch</div>
                    <div>{repository.default_branch}</div>
                    <div className="font-medium">Created</div>
                    <div>{new Date(repository.created_at).toLocaleDateString()}</div>
                    <div className="font-medium">Last Updated</div>
                    <div>{new Date(repository.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Top Languages</h3>
                <div className="rounded-md border p-3">
                  {languageArray.slice(0, 5).map((language) => (
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
            </div>
          </TabsContent>
          
          <TabsContent value="branches" className="space-y-4 pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Repository Branches</h3>
              <div className="rounded-md border divide-y">
                {branches.map((branch) => (
                  <div key={branch.name} className="p-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <GitBranch className="mr-2 h-4 w-4" />
                      <span>{branch.name}</span>
                    </div>
                    {branch.protected && (
                      <Badge variant="outline">Protected</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="contributors" className="space-y-4 pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Contributors</h3>
              <div className="rounded-md border divide-y">
                {contributors.map((contributor) => (
                  <div key={contributor.id} className="p-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <img 
                        src={contributor.avatar_url} 
                        alt={contributor.login} 
                        className="mr-2 h-6 w-6 rounded-full"
                      />
                      <a 
                        href={contributor.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {contributor.login}
                      </a>
                    </div>
                    <Badge variant="secondary">{contributor.contributions} commits</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="languages" className="space-y-4 pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Language Breakdown</h3>
              <div className="rounded-md border p-3">
                {languageArray.map((language) => (
                  <div key={language.name} className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span>{language.name}</span>
                      <span>
                        {language.percentage}% 
                        <span className="ml-2 text-gray-500">
                          ({(language.bytes / 1024).toFixed(1)} KB)
                        </span>
                      </span>
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
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Commit Activity</h3>
              <div className="rounded-md border p-3">
                {hasCommitActivity ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {lastFourWeeksActivity.map((week: any, index: number) => (
                        <div key={index} className="p-2 border rounded-md text-center">
                          <div className="text-sm font-medium">Week {index + 1}</div>
                          <div className="text-2xl font-bold">{week.total}</div>
                          <div className="text-xs text-muted-foreground">commits</div>
                        </div>
                      ))}
                    </div>
                    
                    <h4 className="text-sm font-medium mt-4">Day Breakdown (Last Week)</h4>
                    <div className="grid grid-cols-7 gap-1">
                      {lastFourWeeksActivity[3]?.days.map((count: number, day: number) => (
                        <div 
                          key={day} 
                          className="p-2 border rounded-md text-center"
                          style={{
                            backgroundColor: count > 0 
                              ? `rgba(0, 0, 255, ${Math.min(0.1 + (count / 20), 0.5)})` 
                              : undefined
                          }}
                        >
                          <div className="text-xs">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                          </div>
                          <div className="text-lg font-semibold">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No commit activity data available</p>
                  </div>
                )}
              </div>
              
              {participation && (
                <>
                  <h3 className="text-sm font-medium">Participation</h3>
                  <div className="rounded-md border p-3">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Owner</span>
                          <span>
                            {participation.owner.reduce((sum: number, val: number) => sum + val, 0)} commits
                          </span>
                        </div>
                        <div className="h-6 w-full rounded-md bg-gray-200 dark:bg-gray-700 flex">
                          {participation.owner.map((count: number, week: number) => (
                            <div
                              key={week}
                              className="h-full bg-green-500"
                              style={{ 
                                width: `${(100 / 52)}%`,
                                opacity: Math.min(0.2 + (count / 20), 1)
                              }}
                              title={`Week ${week + 1}: ${count} commits`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>All</span>
                          <span>
                            {participation.all.reduce((sum: number, val: number) => sum + val, 0)} commits
                          </span>
                        </div>
                        <div className="h-6 w-full rounded-md bg-gray-200 dark:bg-gray-700 flex">
                          {participation.all.map((count: number, week: number) => (
                            <div
                              key={week}
                              className="h-full bg-blue-500"
                              style={{ 
                                width: `${(100 / 52)}%`,
                                opacity: Math.min(0.2 + (count / 20), 1)
                              }}
                              title={`Week ${week + 1}: ${count} commits`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pullrequests" className="space-y-4 pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Open Pull Requests</h3>
              <div className="rounded-md border divide-y">
                {hasPullRequests && openPullRequests.length > 0 ? (
                  openPullRequests.map((pr: any) => (
                    <div key={pr.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <GitPullRequest className="mr-2 h-4 w-4 text-green-500" />
                          <a 
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                          >
                            {pr.title}
                          </a>
                        </div>
                        <Badge>#{pr.number}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Opened by <span className="font-medium">{pr.user.login}</span> on {new Date(pr.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No open pull requests
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 