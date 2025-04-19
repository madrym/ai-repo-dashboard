import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Key, AlertCircle, Check, RotateCcw, Cpu, Download } from "lucide-react";
import { useLLMApiKey } from "@/lib/llm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Markdown from 'markdown-to-jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MermaidDiagram from './mermaid-diagram';

// Define the structure for parsed sections
interface AnalysisSection {
  title: string;
  content: string;
}

// Function to parse the markdown content by H2 headers
const parseMarkdownSections = (markdown: string): AnalysisSection[] => {
  if (!markdown) return [];
  const sections = [];
  // Split by H2 headers (## followed by space)
  const rawSections = markdown.split(/^##\s+/m).filter(Boolean);

  for (const section of rawSections) {
    const lines = section.trim().split('\n');
    if (lines.length > 0) {
      const title = lines[0].trim(); // First line is the title
      const content = lines.slice(1).join('\n').trim(); // Rest is content
      if (title && content) { // Only add if both title and content exist
        sections.push({ title, content });
      }
    }
  }
  return sections;
};

interface AIAnalysisProps {
  org?: string;
  repo?: string;
  branch?: string;
  repositoryName?: string;
}

export function AIAnalysis({ org, repo, branch, repositoryName }: AIAnalysisProps) {
  const { apiKey, provider, saveApiKey, saveProvider, isLoading: isLoadingApiKey } = useLLMApiKey();
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // State for the full markdown and parsed sections
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [analysisSections, setAnalysisSections] = useState<AnalysisSection[]>([]);
  const [overviewExists, setOverviewExists] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isFetchingOverview, setIsFetchingOverview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // Helper to construct API URL
  const getApiUrl = (action: 'generate-overview' | 'get-overview'): string | null => {
    if (!org || !repo || !branch) return null;
    return `/api/repos/${org}/${repo}/${branch}/${action}`;
  };

  // Fetch the existing overview file
  const fetchOverview = useCallback(async () => {
    const apiUrl = getApiUrl('get-overview');
    if (!apiUrl) return;

    setIsFetchingOverview(true);
    setError(null);
    setRawMarkdown(null);
    setAnalysisSections([]);
    setActiveTab('');
    setOverviewExists(false);

    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const markdown = await response.text();
        const sections = parseMarkdownSections(markdown);
        setRawMarkdown(markdown);
        setAnalysisSections(sections);
        setOverviewExists(true);
        if (sections.length > 0) {
          setActiveTab(sections[0].title);
        }
      } else if (response.status === 404) {
        console.log('AI overview file not found.');
        setOverviewExists(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch overview (${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching AI overview:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AI overview.');
    } finally {
      setIsFetchingOverview(false);
    }
  }, [org, repo, branch]);

  // Generate new repository analysis
  const generateAnalysis = async () => {
    const apiUrl = getApiUrl('generate-overview');
    if (!apiUrl) {
        setError('Missing repository details (org, repo, branch).');
        return;
    }

    if (!apiKey) {
      setError('API key is required. Please add your API key to continue.');
      setShowApiKeyInput(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, provider }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate overview (${response.status})`);
      }

      // If generation is successful, fetch the new overview
      await fetchOverview(); 
      
    } catch (err) {
      console.error(`Error generating overview:`, err);
      setError(err instanceof Error ? err.message : 'Failed to generate overview.');
      if (err instanceof Error && (err.message.includes('API key') || err.message.includes('configuration'))) {
        setShowApiKeyInput(true);
      }
      // If generation failed because repomix wasn't found
      if (err instanceof Error && err.message.includes('repomix-output.xml not found')) {
         setError('repomix-output.xml not found. Please ensure the repository data is generated before running AI analysis.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Save API key
  const handleSaveApiKey = () => {
    if (newApiKey && newApiKey.trim()) {
      saveApiKey(newApiKey.trim());
      setNewApiKey('');
      setShowApiKeyInput(false);
      setError(null);
    }
  };
  
  // Handle provider change
  const handleProviderChange = (value: string) => {
    saveProvider(value);
  };

  // Fetch overview when component mounts or repo details change
  useEffect(() => {
    if (org && repo && branch) {
      fetchOverview();
    }
    // Clear state if repo details are missing
    else {
        setRawMarkdown(null);
        setAnalysisSections([]);
        setActiveTab('');
        setOverviewExists(false);
        setError(null);
    }
  }, [org, repo, branch, fetchOverview]);

  if (isLoadingApiKey) {
    return <div className="flex items-center justify-center h-full">Loading API Key status...</div>;
  }

  // --- Define overrides for markdown-to-jsx ---
  const markdownOptions = {
    forceBlock: true, 
    overrides: {
        // Remove the 'pre' override entirely
        /*
        pre: {
           // ... old pre override logic ...
        },
        */
        // Override 'code' to handle inline, blocks, and mermaid
        code: {
            component: ({ children, className, ...props }: { children?: React.ReactNode, className?: string, [key: string]: any }) => {
                 const match = /lang-(\w+)/.exec(className || '');
                 const lang = match ? match[1] : null;
                 const codeContent = String(children).replace(/\n$/, ''); // Get the code string

                 console.log(`[Override: code] Detected language: ${lang} (className: ${className || 'none'})`);

                 if (lang === 'mermaid') {
                     console.log('[Override: code] Rendering MermaidDiagram...');
                     // Render MermaidDiagram, potentially wrapping it if needed
                     return <div className="mermaid-container my-4"><MermaidDiagram chart={codeContent} /></div>;
                 } else if (lang) {
                      console.log(`[Override: code] Rendering standard code block (lang: ${lang}).`);
                     // Render other language blocks wrapped in <pre>
                     return (
                         <pre className="bg-muted p-4 rounded-md overflow-auto my-4 text-sm" {...props}>
                             <code className={className}>
                                 {children} 
                             </code>
                         </pre>
                     );
                 } else {
                     console.log('[Override: code] Rendering inline code.');
                     // Assume inline code if no language class is found
                     return (
                         <code className="bg-muted/50 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                             {children}
                         </code>
                     );
                 }
            },
        },
        // Add overrides for other elements if needed (e.g., tables, headings for styling)
        // table: { component: 'table', props: { className: 'table-auto ...' } },
    },
  };

  // console.log("[AIAnalysis] Rendering with markdownOptions:", markdownOptions); // Keep commented for now

  return (
    <div className="space-y-4">
      {/* API Key Configuration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Repository AI Analysis</h3>
          <Badge variant={apiKey ? "success" : "outline"} className="text-xs">
            {apiKey ? <Check className="h-3 w-3 mr-1" /> : <Key className="h-3 w-3 mr-1" />}
            {apiKey ? "API Key Set" : "No API Key"}
          </Badge>
          <Badge variant="secondary" className="text-xs capitalize">
            {provider}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="claude">Anthropic Claude</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            <Key className="h-4 w-4 mr-1" />
            {apiKey ? "Change API Key" : "Add API Key"}
          </Button>
        </div>
      </div>

      {showApiKeyInput && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">{provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'} API Key</CardTitle>
            <CardDescription>
              Enter your {provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Google' : 'Anthropic'} API key to enable AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={provider === 'openai' ? 'sk-...' : provider === 'gemini' ? 'AIza...' : 'sk-ant-...'}
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={handleSaveApiKey} disabled={!newApiKey.trim()}>
                Save Key
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {error.includes('repomix-output.xml not found') && (
            <div className="mt-4">
              <p className="text-sm mb-2">The analysis requires repository data from repomix-output.xml file. You might need to generate it first.</p>
            </div>
          )}
        </Alert>
      )}

      <div className="flex justify-end items-center gap-2">
        {rawMarkdown && (
          <Button 
            size="sm"
            variant="outline"
            onClick={() => {
              const blob = new Blob([rawMarkdown], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${org}-${repo}-${branch}-ai-overview.md`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
              <Download className="h-4 w-4 mr-1" />
              Download MD
          </Button>
        )}
        <Button 
          size="sm" 
          variant="default"
          onClick={generateAnalysis} 
          disabled={isGenerating || isFetchingOverview || !apiKey || !org || !repo || !branch}
        >
          {isGenerating ? (
            <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
          ) : isFetchingOverview ? (
            <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Loading...</>
          ) : overviewExists ? (
            <><RotateCcw className="h-4 w-4 mr-1" /> Regenerate Overview</>
          ) : (
            <><Cpu className="h-4 w-4 mr-1" /> Generate Overview</>
          )}
        </Button>
      </div>

      <Separator />

      <div className="space-y-6">
        {isFetchingOverview ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Loading AI repository overview...</p>
          </div>
        ) : analysisSections.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1 h-auto flex-wrap">
              {analysisSections.map((section) => (
                <TabsTrigger key={section.title} value={section.title} className="text-xs px-2 py-1.5 whitespace-normal h-auto text-center">
                  {section.title.replace(/^\S+\s+/, '')}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {analysisSections.map((section) => (
              <TabsContent key={section.title} value={section.title} className="mt-4">
                <Card>
                  <CardHeader className="py-3 bg-muted/50">
                    <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Markdown options={markdownOptions}>
                      {section.content}
                    </Markdown>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : !error ? (
          <div className="text-center py-12 text-muted-foreground">
             <Cpu className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No AI repository overview available.</p>
            <p className="text-sm mt-2">
              {apiKey ? 
                'Click the Generate Overview button to analyze this repository.' : 
                'Please add your API key and then click Generate Overview.'
              }
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
} 