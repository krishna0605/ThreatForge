"use client";

import React, { useEffect, useState, useId } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#008f39', // Forest Green/Tech Green
    primaryTextColor: '#fff',
    primaryBorderColor: '#008f39',
    lineColor: '#0066cc', // Tech Blue
    secondaryColor: '#0066cc',
    tertiaryColor: '#1a202c',
    fontFamily: 'JetBrains Mono, monospace',
  },
  securityLevel: 'loose',
});

interface MermaidProps {
  chart: string;
  id?: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart, id }) => {
  const [svg, setSvg] = useState<string>('');
  const generatedId = useId(); 
  const elementId = id || `mermaid-${generatedId.replace(/:/g, '')}`; 

  useEffect(() => {
    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(elementId, chart);
        setSvg(renderedSvg);
      } catch (error) {
        console.error('Mermaid rendering error:', error);
      }
    };

    renderChart();
  }, [chart, elementId]);

  return (
    <div 
      className="mermaid-container flex justify-center py-10 w-full overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Mermaid;
