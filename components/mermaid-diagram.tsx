'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader } from './ui/card'; // Added CardHeader
import { AlertCircle, Code, Eye, RefreshCw } from 'lucide-react'; // Added Code, Eye, RefreshCw icons
import { Button } from './ui/button'; // Added Button
import { Separator } from './ui/separator'; // Added Separator

interface MermaidDiagramProps {
  chart: string;
}

// Generate a unique ID for each diagram
let diagramIdCounter = 0;
const generateId = () => `mermaid-diagram-${diagramIdCounter++}`;

// Initialize Mermaid once globally (safer approach)
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default', // Or 'dark', 'neutral', 'forest'
    securityLevel: 'loose', // Adjust as needed, 'strict' is safer but more restrictive
    // Add other mermaid configurations if needed
  });
  console.log('[Mermaid] Initialized');
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [uniqueId] = useState(generateId()); // Stable unique ID per instance
  const [showCode, setShowCode] = useState(false); // State for toggling code view

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      // Guard clause: Only render if not showing code and chart is present
      if (showCode || !chart || !isMounted) {
        console.log('[Mermaid] Skipping render (showCode:', showCode, ', !chart:', !chart, ', !isMounted:', !isMounted, ')');
        if (svgContent) setSvgContent(null); // Clear SVG if switching to code view or chart disappears
        if (isRendering) setIsRendering(false);
        return;
      }
      
      console.log(`[Mermaid] Attempting render for ID: ${uniqueId}`);
      setIsRendering(true);
      setError(null); // Clear previous errors
      // setSvgContent(null); // Clear previous SVG immediately to show loading

      try {
        // Use mermaid.render()
        const renderResult = await mermaid.render(uniqueId, chart);
        const svg = renderResult.svg;
        // const bindFunctions = renderResult.bindFunctions; // Optional: if you need interactions
        
        console.log(`[Mermaid] Render successful for ID: ${uniqueId}. SVG length: ${svg?.length}`);
        // console.log('[Mermaid] SVG:', svg); // Uncomment for detailed SVG logging
        
        if (isMounted) {
          setSvgContent(svg);
          // Optional: Call bindFunctions if needed for interactions
          // if (bindFunctions && containerRef.current) {
          //   bindFunctions(containerRef.current);
          // }
        }
      } catch (e: any) {
        console.error(`[Mermaid Error] ID: ${uniqueId}`, e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'Failed to render Mermaid diagram.');
          setSvgContent(null); // Clear SVG on error
        }
      } finally {
        if (isMounted) {
            setIsRendering(false);
        }
      }
    };

    // Use setTimeout to ensure the DOM element is ready and avoid potential race conditions
    const timer = setTimeout(renderDiagram, 0); 

    return () => {
      console.log(`[Mermaid] Cleanup for ID: ${uniqueId}`);
      isMounted = false;
      clearTimeout(timer);
      // Clean up the rendered element if necessary (might not be strictly needed)
      const element = document.getElementById(uniqueId);
      if (element) element.remove();
    };
  }, [chart, uniqueId, showCode]); // Effect dependencies

  const isLoading = isRendering || (!svgContent && !error && !showCode);

  return (
    <Card className="my-4 overflow-hidden border border-dashed border-primary/50 bg-primary/5">
      {/* Optional Header with Toggle Button */}
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4 bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">Mermaid Diagram</span>
        <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)} className="h-7 px-2">
          {showCode ? (
            <><Eye className="h-4 w-4 mr-1" /> View Diagram</>
          ) : (
            <><Code className="h-4 w-4 mr-1" /> View Code</>
          )}
        </Button>
      </CardHeader>
      <Separator />
      <CardContent ref={containerRef} className="p-4 text-center min-h-[100px]"> {/* Added min-height */}
        {showCode ? (
          // Display Raw Code
          <pre className="text-left text-sm bg-muted/50 p-3 rounded overflow-auto max-h-96">
            <code>
              {chart}
            </code>
          </pre>
        ) : error ? (
          <div className="text-destructive flex flex-col items-center space-y-2">
            <AlertCircle className="h-8 w-8" />
            <p className="font-semibold">Mermaid Rendering Error</p>
            <pre className="text-xs text-left bg-destructive/10 p-2 rounded overflow-auto max-h-40 w-full">
              {error}
            </pre>
          </div>
        ) : isLoading ? ( 
           <div className="text-muted-foreground py-4 flex items-center justify-center space-x-2">
             <RefreshCw className="h-4 w-4 animate-spin" />
             <span>Loading diagram...</span>
          </div>
        ) : svgContent ? (
          // Render the SVG directly using dangerouslySetInnerHTML
          <div 
            // Use the unique ID as the container ID IF mermaid.render needs it, 
            // otherwise, just use dangerouslySetInnerHTML
            // id={uniqueId} // This might not be needed if mermaid.render directly returns SVG
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="flex justify-center items-center [&>svg]:max-w-full [&>svg]:h-auto"
            />
        ) : (
          // Placeholder while rendering or if SVG content is null
          <div className="text-muted-foreground py-4">No diagram content.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default MermaidDiagram; 