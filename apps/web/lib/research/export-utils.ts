/**
 * Export utilities for Research Synthesis
 * Handles exporting research papers to various formats
 */

import { tiptapToMarkdown } from '@/lib/utils/markdown-to-tiptap';
import type { JSONContent } from '@tiptap/react';

/**
 * Export content as Markdown file
 */
export function exportAsMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(filename)}.md`);
}

/**
 * Export Tiptap JSON content as Markdown file
 */
export function exportTiptapAsMarkdown(content: JSONContent, filename: string) {
  const markdown = tiptapToMarkdown(content);
  exportAsMarkdown(markdown, filename);
}

/**
 * Export content as HTML file with styling
 */
export function exportAsHTML(
  content: string,
  filename: string,
  format: 'academic' | 'blog' | 'technical-report' = 'academic'
) {
  // Convert markdown to HTML (basic conversion)
  const html = markdownToHTML(content);

  // Apply format-specific styling
  const styledHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitizeFilename(filename)}</title>
  <style>
${getFormatCSS(format)}
  </style>
</head>
<body>
  <article>
${html}
  </article>
</body>
</html>`;

  const blob = new Blob([styledHTML], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(filename)}.html`);
}

/**
 * Export content as plain text file
 */
export function exportAsText(content: string, filename: string) {
  // Strip markdown formatting for plain text
  const plainText = stripMarkdown(content);
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(filename)}.txt`);
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Basic markdown to HTML conversion
 */
function markdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

  // Wrap consecutive <li> in <ul> or <ol>
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  return html;
}

/**
 * Strip markdown formatting for plain text
 */
function stripMarkdown(markdown: string): string {
  let text = markdown;

  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');

  // Remove list markers
  text = text.replace(/^\*\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');

  return text;
}

/**
 * Get CSS styling for different formats
 */
function getFormatCSS(format: 'academic' | 'blog' | 'technical-report'): string {
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-weight: 600;
      line-height: 1.3;
    }

    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; }
    h3 { font-size: 1.5rem; }

    p {
      margin-bottom: 1rem;
    }

    ul, ol {
      margin-left: 2rem;
      margin-bottom: 1rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    code {
      background: #f4f4f4;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    pre {
      background: #2d2d2d;
      color: #f8f8f8;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #666;
      font-style: italic;
    }

    a {
      color: #0066cc;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    strong {
      font-weight: 600;
    }

    em {
      font-style: italic;
    }
  `;

  const formatSpecificStyles = {
    academic: `
      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 2;
      }

      h1 {
        text-align: center;
        margin-bottom: 2rem;
      }

      @media print {
        body {
          max-width: 100%;
        }
      }
    `,
    blog: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 16pt;
        line-height: 1.7;
      }

      h1 {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h2 {
        margin-top: 2rem;
      }
    `,
    'technical-report': `
      body {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14pt;
        line-height: 1.5;
      }

      h1, h2, h3 {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      code {
        background: #e8e8e8;
      }
    `,
  };

  return baseStyles + formatSpecificStyles[format];
}

/**
 * Sanitize filename for safe download
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
