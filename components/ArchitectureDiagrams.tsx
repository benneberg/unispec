import React, { useState, useEffect, useRef } from 'react';
import { type ArchitectureDiagrams } from '../types';
import { Download, Copy } from './Icons';

declare global {
  interface Window {
    mermaid?: {
      run: (options?: { nodes: Array<Element>, suppressErrors?: boolean }) => void;
    };
  }
}

const Diagram: React.FC<{ title: string; mermaidCode: string }> = ({ title, mermaidCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.mermaid && containerRef.current) {
        // Ensure the content is set before running mermaid
        if(containerRef.current.textContent !== mermaidCode) {
            containerRef.current.textContent = mermaidCode;
        }
        try {
            window.mermaid.run({ nodes: [containerRef.current] });
        } catch(e) {
            console.error("Mermaid rendering error:", e);
            // Optionally display an error message in the container
            containerRef.current.innerHTML = `<p class="text-red-400">Error rendering diagram. Check Mermaid syntax.</p>`;
        }
    }
  }, [mermaidCode, title]);

  const copyMarkdown = () => {
    navigator.clipboard.writeText('```mermaid\n' + mermaidCode + '\n```');
  };

  const exportPng = () => {
    if (!containerRef.current) return;
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) {
        alert("Could not find the rendered SVG diagram to export.");
        return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const svgSize = svgElement.getBoundingClientRect();
    canvas.width = svgSize.width * 2; // Increase resolution
    canvas.height = svgSize.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill background for transparent SVGs
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.scale(2, 2);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${title.toLowerCase().replace(/\s/g, '-')}-diagram.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.onerror = () => {
        alert("Failed to load SVG into an image for export.");
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-semibold text-purple-300">{title}</h5>
        <div className="flex gap-2">
          <button onClick={copyMarkdown} className="p-2 bg-slate-700 hover:bg-slate-600 rounded" title="Copy Markdown"><Copy className="w-4 h-4" /></button>
          <button onClick={exportPng} className="p-2 bg-slate-700 hover:bg-slate-600 rounded" title="Export as PNG"><Download className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="bg-slate-900 p-4 rounded-lg overflow-auto flex justify-center min-h-[200px]">
        <div ref={containerRef} className="mermaid">
            {mermaidCode}
        </div>
      </div>
    </div>
  );
};


const ArchitectureDiagrams: React.FC<{ diagrams: ArchitectureDiagrams }> = ({ diagrams }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-6">
      <h3 className="text-xl font-bold">Architecture Diagrams</h3>
      <div className="space-y-6">
        {diagrams.c4 && <Diagram title="C4 Container" mermaidCode={diagrams.c4} />}
        {diagrams.sequence && <Diagram title="Sequence Diagram" mermaidCode={diagrams.sequence} />}
        {diagrams.schema && <Diagram title="Database Schema (ERD)" mermaidCode={diagrams.schema} />}
        {!diagrams.c4 && !diagrams.sequence && !diagrams.schema && (
            <p className="text-slate-400">No diagrams were generated.</p>
        )}
      </div>
    </div>
  );
};

export default ArchitectureDiagrams;
