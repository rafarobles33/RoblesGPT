import { useMemo } from "react";

export function MarkdownRenderer({ content }: { content: string }) {
  const htmlContent = useMemo(() => {
    let html = content
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-secondary p-4 rounded-md overflow-x-auto my-4 text-sm font-mono border border-border text-foreground"><code>$1</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
      
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p class="mb-2">')
      
      // Single newlines
      .replace(/\n/g, '<br/>');

    return `<p class="mb-2">${html}</p>`;
  }, [content]);

  return (
    <div 
      className="prose prose-invert max-w-none text-foreground prose-p:leading-relaxed prose-pre:p-0"
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
}