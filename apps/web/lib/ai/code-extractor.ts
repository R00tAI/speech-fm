/**
 * Comprehensive code extraction utility for live previews
 * Handles multiple extraction strategies with confidence scoring
 */

export interface ExtractedCode {
  code: string;
  language: string;
  framework: 'react' | 'html' | 'vue' | 'svelte' | 'unknown';
  hasJSX: boolean;
  imports: string[];
  exports: string[];
  confidence: number; // 0-1, how confident we are this is the right code
}

export function extractCodeFromText(text: string): ExtractedCode | null {
  // Strategy 1: Find React/TSX component code blocks (highest priority)
  // Strategy 2: Find any code block with JSX
  // Strategy 3: Find TypeScript code blocks
  // Strategy 4: Find JavaScript code blocks
  // Strategy 5: Find HTML code
  // Strategy 6: Find any code block
  // Strategy 7: Detect inline code without markers

  const strategies = [
    extractReactComponent,
    extractJSXCode,
    extractTypeScriptCode,
    extractJavaScriptCode,
    extractHTMLCode,
    extractAnyCodeBlock,
    extractInlineCode,
  ];

  for (const strategy of strategies) {
    const result = strategy(text);
    if (result && result.confidence >= 0.7) {
      console.log('[CodeExtractor] Extracted code:', {
        strategy: strategy.name,
        confidence: result.confidence,
        framework: result.framework,
        hasJSX: result.hasJSX,
        codeLength: result.code.length,
        imports: result.imports.length,
        exports: result.exports.length,
      });
      return result;
    }
  }

  return null;
}

function extractReactComponent(text: string): ExtractedCode | null {
  // Look for React components with explicit language tags (more flexible with newlines)
  const reactPatterns = [
    /```(?:tsx|jsx)\s*\n?([\s\S]*?)```/g,
    /```(?:typescript|javascript)\s*\n?([\s\S]*?export\s+(?:default\s+)?(?:function|const)\s+[A-Z][\w]*[\s\S]*?)```/g,
  ];

  let bestMatch: { code: string; confidence: number } | null = null;

  for (const pattern of reactPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const code = match[1].trim();
      if (!code) continue;

      // Check if it's a React component
      const hasReact = hasReactImport(code);
      const hasJsx = hasJSX(code);
      const hasComponentExport = hasExport(code) && /export\s+(?:default\s+)?(?:function|const)\s+[A-Z]/.test(code);

      if ((hasReact && hasJsx) || (hasJsx && hasComponentExport)) {
        const confidence = hasReact && hasJsx && hasComponentExport ? 0.95 : 0.9;

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { code, confidence };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      code: bestMatch.code,
      language: 'tsx',
      framework: 'react',
      hasJSX: true,
      imports: extractImports(bestMatch.code),
      exports: extractExports(bestMatch.code),
      confidence: bestMatch.confidence,
    };
  }

  return null;
}

function extractJSXCode(text: string): ExtractedCode | null {
  // Look for any code block containing JSX, regardless of language tag (more flexible)
  const codeBlockPattern = /```(?:\w+)?\s*\n?([\s\S]*?)```/g;
  const matches = [...text.matchAll(codeBlockPattern)];

  let bestMatch: { code: string; confidence: number } | null = null;

  for (const match of matches) {
    const code = match[1].trim();
    if (!code) continue;

    if (hasJSX(code)) {
      // Prefer code with exports
      const hasExports = hasExport(code);
      const confidence = hasExports ? 0.9 : 0.85;

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { code, confidence };
      }
    }
  }

  if (bestMatch) {
    return {
      code: bestMatch.code,
      language: 'jsx',
      framework: determineFramework(bestMatch.code),
      hasJSX: true,
      imports: extractImports(bestMatch.code),
      exports: extractExports(bestMatch.code),
      confidence: bestMatch.confidence,
    };
  }

  return null;
}

function extractTypeScriptCode(text: string): ExtractedCode | null {
  // Look for TypeScript code blocks (more flexible)
  const tsPattern = /```(?:typescript|ts)\s*\n?([\s\S]*?)```/g;
  const matches = [...text.matchAll(tsPattern)];

  if (matches.length > 0) {
    // Get the last TypeScript block
    const lastMatch = matches[matches.length - 1];
    const code = lastMatch[1].trim();

    if (code) {
      return {
        code,
        language: 'typescript',
        framework: determineFramework(code),
        hasJSX: hasJSX(code),
        imports: extractImports(code),
        exports: extractExports(code),
        confidence: 0.8,
      };
    }
  }

  return null;
}

function extractJavaScriptCode(text: string): ExtractedCode | null {
  // Look for JavaScript code blocks (more flexible)
  const jsPattern = /```(?:javascript|js)\s*\n?([\s\S]*?)```/g;
  const matches = [...text.matchAll(jsPattern)];

  if (matches.length > 0) {
    // Get the last JavaScript block
    const lastMatch = matches[matches.length - 1];
    const code = lastMatch[1].trim();

    if (code) {
      return {
        code,
        language: 'javascript',
        framework: determineFramework(code),
        hasJSX: hasJSX(code),
        imports: extractImports(code),
        exports: extractExports(code),
        confidence: 0.75,
      };
    }
  }

  return null;
}

function extractHTMLCode(text: string): ExtractedCode | null {
  // Look for HTML code blocks (more flexible pattern)
  const htmlPattern = /```(?:html|xml)\s*\n?([\s\S]*?)```/g;
  const matches = [...text.matchAll(htmlPattern)];

  if (matches.length > 0) {
    // Get the last HTML block
    const lastMatch = matches[matches.length - 1];
    const code = lastMatch[1].trim();

    if (code && (code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<div'))) {
      return {
        code,
        language: 'html',
        framework: 'html',
        hasJSX: false,
        imports: [],
        exports: [],
        confidence: 0.7,
      };
    }
  }

  return null;
}

function extractAnyCodeBlock(text: string): ExtractedCode | null {
  // Extract any code block, prioritizing ones with programming constructs (more flexible)
  const codeBlockPattern = /```(?:\w+)?\s*\n?([\s\S]*?)```/g;
  const matches = [...text.matchAll(codeBlockPattern)];

  if (matches.length > 0) {
    // Try to find the best code block by looking for programming keywords
    let bestMatch: { code: string; score: number } | null = null;

    for (const match of matches) {
      const code = match[1].trim();
      if (!code) continue;

      // Score based on programming constructs
      let score = 0;
      if (/\b(?:function|const|let|var|class|interface|type)\b/.test(code)) score += 2;
      if (/\b(?:import|export)\b/.test(code)) score += 3;
      if (/<[A-Za-z][\w]*[^>]*>/.test(code)) score += 2; // HTML/JSX tags
      if (/\breturn\s+[(<]/.test(code)) score += 1;

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { code, score };
      }
    }

    if (bestMatch && bestMatch.score > 0) {
      return {
        code: bestMatch.code,
        language: 'unknown',
        framework: determineFramework(bestMatch.code),
        hasJSX: hasJSX(bestMatch.code),
        imports: extractImports(bestMatch.code),
        exports: extractExports(bestMatch.code),
        confidence: 0.5,
      };
    }
  }

  return null;
}

function extractInlineCode(text: string): ExtractedCode | null {
  // Last resort: look for code patterns without markdown markers
  // Only if the text looks like code (has imports/exports/function definitions)

  const codePatterns = [
    /\bimport\s+.*\s+from\s+['"][^'"]+['"]/,
    /\bexport\s+(?:default\s+)?(?:function|const|class)\s+\w+/,
    /\bfunction\s+[A-Z]\w*\s*\(/,
    /\bconst\s+[A-Z]\w*\s*=\s*\(/,
  ];

  const looksLikeCode = codePatterns.some(pattern => pattern.test(text));

  if (looksLikeCode) {
    // Try to extract the code portion
    const lines = text.split('\n');
    const codeLines: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      // Start collecting when we see code-like patterns
      if (!inCodeBlock && (
        /^\s*(?:import|export|function|const|let|var|class|interface|type)\b/.test(line) ||
        /^\s*<[A-Z]/.test(line)
      )) {
        inCodeBlock = true;
      }

      if (inCodeBlock) {
        // Stop if we hit prose-like content
        if (/^[A-Z][^{}<>()]*[.!?]$/.test(line.trim())) {
          break;
        }
        codeLines.push(line);
      }
    }

    const code = codeLines.join('\n').trim();

    if (code && code.length > 20) {
      return {
        code,
        language: 'unknown',
        framework: determineFramework(code),
        hasJSX: hasJSX(code),
        imports: extractImports(code),
        exports: extractExports(code),
        confidence: 0.3,
      };
    }
  }

  return null;
}

// Utility functions

function hasReactImport(code: string): boolean {
  return /import\s+.*\s+from\s+['"]react['"]/i.test(code) ||
         /import\s+React\s+from/.test(code) ||
         /import\s+\{.*\}\s+from\s+['"]react['"]/.test(code);
}

function hasJSX(code: string): boolean {
  // Check for JSX elements (opening tags with uppercase or lowercase)
  const jsxPatterns = [
    /<[A-Z][a-zA-Z0-9]*(?:\s[^>]*)?>/, // Component tags: <Button>, <MyComponent />
    /<[a-z]+(?:\s[^>]*)?(?:className|onClick|onChange|onSubmit)/, // HTML tags with React props
    /return\s*\(\s*</, // return (<div>...)
    /return\s+</, // return <div>
    /=>\s*\(?\s*</, // arrow function returning JSX: => <div> or => (<div> with optional whitespace
  ];

  return jsxPatterns.some(pattern => pattern.test(code));
}

function hasExport(code: string): boolean {
  return /\bexport\s+(?:default\s+)?(?:function|const|class|interface|type)\b/.test(code);
}

function extractImports(code: string): string[] {
  const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
  const matches = [...code.matchAll(importRegex)];
  return matches.map(m => m[1]);
}

function extractExports(code: string): string[] {
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g;
  const matches = [...code.matchAll(exportRegex)];
  return matches.map(m => m[1]);
}

function determineFramework(code: string): ExtractedCode['framework'] {
  if (hasReactImport(code) || hasJSX(code)) return 'react';
  if (code.includes('Vue.component') || /import\s+.*\s+from\s+['"]vue['"]/.test(code)) return 'vue';
  if (code.includes('Svelte') || code.includes('$:')) return 'svelte';
  if (code.includes('<!DOCTYPE html>') || code.includes('<html')) return 'html';
  return 'unknown';
}
