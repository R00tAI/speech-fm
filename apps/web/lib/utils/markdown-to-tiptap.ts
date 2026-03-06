import type { JSONContent } from '@tiptap/react';

/**
 * Convert markdown content to Tiptap JSON format
 * This is a simple converter for basic markdown syntax
 */
export function markdownToTiptap(markdown: string): JSONContent {
  const lines = markdown.split('\n');
  const content: JSONContent[] = [];

  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text }],
        });
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Heading level 1
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: trimmed.slice(2) }],
      });
      continue;
    }

    // Heading level 2
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmed.slice(3) }],
      });
      continue;
    }

    // Heading level 3
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: trimmed.slice(4) }],
      });
      continue;
    }

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      // Find consecutive list items
      const listItems: JSONContent[] = [];
      let i = lines.indexOf(line);
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: currentLine.slice(2) }],
              },
            ],
          });
          i++;
        } else {
          break;
        }
      }
      if (listItems.length > 0) {
        content.push({
          type: 'bulletList',
          content: listItems,
        });
      }
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      flushParagraph();
      const listItems: JSONContent[] = [];
      let i = lines.indexOf(line);
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        if (/^\d+\.\s/.test(currentLine)) {
          const text = currentLine.replace(/^\d+\.\s/, '');
          listItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text }],
              },
            ],
          });
          i++;
        } else {
          break;
        }
      }
      if (listItems.length > 0) {
        content.push({
          type: 'orderedList',
          content: listItems,
        });
      }
      continue;
    }

    // Regular paragraph line
    currentParagraph.push(line);
  }

  // Flush any remaining paragraph
  flushParagraph();

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

/**
 * Convert Tiptap JSON to markdown
 */
export function tiptapToMarkdown(json: JSONContent): string {
  if (!json.content) return '';

  const lines: string[] = [];

  for (const node of json.content) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      const text = extractText(node);
      lines.push(`${prefix} ${text}`);
      lines.push('');
    } else if (node.type === 'paragraph') {
      const text = extractText(node);
      if (text) {
        lines.push(text);
        lines.push('');
      }
    } else if (node.type === 'bulletList') {
      if (node.content) {
        for (const item of node.content) {
          const text = extractText(item);
          lines.push(`- ${text}`);
        }
      }
      lines.push('');
    } else if (node.type === 'orderedList') {
      if (node.content) {
        node.content.forEach((item, index) => {
          const text = extractText(item);
          lines.push(`${index + 1}. ${text}`);
        });
      }
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

function extractText(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content) {
    return node.content.map(extractText).join('');
  }

  return '';
}
