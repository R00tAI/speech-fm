'use client';

/**
 * Voice31 Reader View
 *
 * Renders web articles and content in CRT aesthetic with:
 * - Typewriter text reveal
 * - Phosphor glow on headlines
 * - CRT filter on images
 * - Scanline overlay
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface ReaderContent {
  title: string;
  source: string;
  url: string;
  content: string;
  textContent: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  publishedDate?: string;
  images: string[];
  wordCount: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  highlights?: string[];
  publishedDate?: string;
  author?: string;
  score?: number;
  imageUrl?: string;
}

interface Voice31ReaderViewProps {
  content?: ReaderContent;
  searchResults?: SearchResult[];
  mode: 'reader' | 'results';
  phosphorColor?: string;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

// =============================================================================
// TYPEWRITER HOOK
// =============================================================================

function useTypewriter(text: string, speed: number = 20, enabled: boolean = true) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayedText, isComplete };
}

// =============================================================================
// READER VIEW COMPONENT
// =============================================================================

const ArticleReader: React.FC<{
  content: ReaderContent;
  phosphorColor: string;
}> = ({ content, phosphorColor }) => {
  const { displayedText: displayedTitle, isComplete: titleComplete } = useTypewriter(
    content.title,
    30,
    true
  );

  // Parse HTML content into plain text paragraphs for display
  const paragraphs = useMemo(() => {
    // Simple HTML stripping and paragraph splitting
    const text = content.textContent || content.content.replace(/<[^>]*>/g, '');
    return text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .slice(0, 20); // Limit paragraphs
  }, [content]);

  const [visibleParagraphs, setVisibleParagraphs] = useState(0);

  // Reveal paragraphs progressively
  useEffect(() => {
    if (titleComplete && visibleParagraphs < paragraphs.length) {
      const timer = setTimeout(() => {
        setVisibleParagraphs((v) => v + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [titleComplete, visibleParagraphs, paragraphs.length]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-current/20 pb-3 mb-4">
        {/* Source */}
        <div
          className="text-xs uppercase tracking-[0.3em] opacity-60 mb-2"
          style={{ color: phosphorColor }}
        >
          {content.source}
        </div>

        {/* Title with typewriter effect */}
        <h1
          className="text-xl md:text-2xl font-bold leading-tight"
          style={{
            color: phosphorColor,
            textShadow: `0 0 10px ${phosphorColor}40, 0 0 20px ${phosphorColor}20`,
          }}
        >
          {displayedTitle}
          {!titleComplete && (
            <span className="animate-pulse ml-1">▌</span>
          )}
        </h1>

        {/* Byline */}
        {content.byline && (
          <div
            className="text-sm opacity-50 mt-2"
            style={{ color: phosphorColor }}
          >
            {content.byline}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          {paragraphs.slice(0, visibleParagraphs).map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm leading-relaxed"
              style={{ color: phosphorColor, opacity: 0.9 }}
            >
              {paragraph}
            </motion.p>
          ))}

          {/* Loading indicator */}
          {visibleParagraphs < paragraphs.length && titleComplete && (
            <div
              className="text-sm opacity-40 animate-pulse"
              style={{ color: phosphorColor }}
            >
              ▌
            </div>
          )}
        </div>

        {/* Images */}
        {content.images.length > 0 && visibleParagraphs >= 3 && (
          <div className="mt-6 space-y-4">
            {content.images.slice(0, 2).map((imageUrl, index) => (
              <motion.div
                key={imageUrl}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 }}
                className="relative overflow-hidden rounded"
                style={{
                  border: `1px solid ${phosphorColor}40`,
                }}
              >
                {/* CRT image filter overlay */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    background: `linear-gradient(transparent 50%, ${phosphorColor}08 50%)`,
                    backgroundSize: '100% 4px',
                  }}
                />
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-auto max-h-48 object-cover"
                  style={{
                    filter: 'saturate(0.8) contrast(1.1)',
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex-shrink-0 border-t border-current/20 pt-3 mt-4 text-xs opacity-40"
        style={{ color: phosphorColor }}
      >
        {content.wordCount.toLocaleString()} words • {content.url}
      </div>
    </div>
  );
};

// =============================================================================
// SEARCH RESULTS COMPONENT
// =============================================================================

const SearchResultsView: React.FC<{
  results: SearchResult[];
  phosphorColor: string;
  onResultClick?: (result: SearchResult) => void;
}> = ({ results, phosphorColor, onResultClick }) => {
  const [visibleResults, setVisibleResults] = useState(0);

  // Cascade results in
  useEffect(() => {
    if (visibleResults < results.length) {
      const timer = setTimeout(() => {
        setVisibleResults((v) => v + 1);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visibleResults, results.length]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-current/20 pb-3 mb-4">
        <h2
          className="text-lg font-bold uppercase tracking-wider"
          style={{
            color: phosphorColor,
            textShadow: `0 0 10px ${phosphorColor}40`,
          }}
        >
          Search Results
        </h2>
        <div
          className="text-xs opacity-50 mt-1"
          style={{ color: phosphorColor }}
        >
          {results.length} results found
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {results.slice(0, visibleResults).map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'p-3 rounded border transition-all cursor-pointer',
              'hover:scale-[1.02]'
            )}
            style={{
              borderColor: `${phosphorColor}30`,
              background: `${phosphorColor}08`,
            }}
            onClick={() => onResultClick?.(result)}
          >
            {/* Result Number */}
            <div
              className="text-xs opacity-40 mb-1"
              style={{ color: phosphorColor }}
            >
              [{String(index + 1).padStart(2, '0')}]
            </div>

            {/* Title */}
            <h3
              className="text-sm font-semibold mb-1 line-clamp-2"
              style={{
                color: phosphorColor,
                textShadow: `0 0 5px ${phosphorColor}30`,
              }}
            >
              {result.title}
            </h3>

            {/* Snippet */}
            <p
              className="text-xs opacity-70 line-clamp-3 mb-2"
              style={{ color: phosphorColor }}
            >
              {result.snippet}
            </p>

            {/* Meta */}
            <div
              className="text-xs opacity-40 flex items-center gap-2"
              style={{ color: phosphorColor }}
            >
              <span className="truncate max-w-[200px]">
                {new URL(result.url).hostname}
              </span>
              {result.publishedDate && (
                <>
                  <span>•</span>
                  <span>{result.publishedDate}</span>
                </>
              )}
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {visibleResults < results.length && (
          <div
            className="text-center text-sm opacity-40 animate-pulse py-2"
            style={{ color: phosphorColor }}
          >
            Loading more results...
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31ReaderView: React.FC<Voice31ReaderViewProps> = ({
  content,
  searchResults,
  mode,
  phosphorColor = '#ffaa00',
  onResultClick,
  className,
}) => {
  if (mode === 'reader' && content) {
    return (
      <div
        className={cn(
          'h-full w-full p-4 font-mono',
          className
        )}
        style={{ color: phosphorColor }}
      >
        <ArticleReader content={content} phosphorColor={phosphorColor} />
      </div>
    );
  }

  if (mode === 'results' && searchResults) {
    return (
      <div
        className={cn(
          'h-full w-full p-4 font-mono',
          className
        )}
        style={{ color: phosphorColor }}
      >
        <SearchResultsView
          results={searchResults}
          phosphorColor={phosphorColor}
          onResultClick={onResultClick}
        />
      </div>
    );
  }

  // Empty state
  return (
    <div
      className={cn(
        'h-full w-full flex items-center justify-center font-mono',
        className
      )}
      style={{ color: phosphorColor }}
    >
      <div className="text-center opacity-40">
        <div className="text-2xl mb-2">◎</div>
        <div className="text-sm uppercase tracking-wider">
          No content to display
        </div>
      </div>
    </div>
  );
};

export default Voice31ReaderView;
