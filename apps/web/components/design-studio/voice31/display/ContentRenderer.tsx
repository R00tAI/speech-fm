'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useVoice31Store } from '../Voice31Store';
import { useStorytellingStore } from '../storytelling/StorytellingStore';
import { StorytellingOrchestrator } from '../storytelling';
import { KineticTypographyRenderer } from '../kinetic-typography';
import { Voice31ReaderView } from '../Voice31ReaderView';
import { Voice31ProgressiveDiagram } from '../Voice31ProgressiveDiagram';
import { Voice31CodeDisplay } from '../Voice31CodeDisplay';
import { CRTOverlayStyles } from './CRTOverlayStyles';
import { DynamicList } from './DynamicList';
import { ImageDisplay } from './ImageDisplay';
import { ProceduralVisualization } from './ProceduralVisualization';
import WeatherDisplay from './WeatherDisplay';

type ContentPosition = 'left' | 'right' | 'center' | 'top' | 'bottom' | null;

/**
 * Content Renderer
 * Decides which content type to render based on store state.
 * Handles priority ordering of content (story > code > browser > diagram > list > image > viz > text).
 */

interface ContentRendererProps {
  size: { width: number; height: number };
  phosphorColor: string;
  rpgModeActive: boolean;
  activeStoryQuestion: string | null;
  clearVisualStory: () => void;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  size,
  phosphorColor,
  rpgModeActive,
  activeStoryQuestion,
  clearVisualStory,
}) => {
  const displayContent = useVoice31Store((s) => s.displayContent);
  const browserState = useVoice31Store((s) => s.browserState);
  const diagramState = useVoice31Store((s) => s.diagramState);
  const codeDisplayState = useVoice31Store((s) => s.codeDisplayState);
  const weatherDisplay = useVoice31Store((s) => s.weatherDisplay);
  const uploads = useVoice31Store((s) => s.uploads);

  const phosphorHex = {
    green: '#33ff33',
    amber: '#ffaa00',
    red: '#ff4444',
    blue: '#4488ff',
    white: '#ffffff',
  }[phosphorColor] || '#ffaa00';

  const diagramWidth = Math.max(360, Math.min(size.width * 0.72, 780));
  const diagramHeight = Math.max(260, Math.min(size.height * 0.78, 540));

  // Handler for when user clicks a search result
  const handleSearchResultClick = useCallback((result: { url: string; title?: string }) => {
    const store = useVoice31Store.getState();
    store.setBrowserLoading(true);
    fetch('/api/voice31/web-fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: result.url }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.content) {
          store.showReaderContent(data.content);
        } else {
          store.setBrowserError('Failed to fetch article');
        }
      })
      .catch(() => {
        store.setBrowserError('Failed to fetch article');
      });
  }, []);

  // Dynamic content wrapper with position-aware layout
  const contentWrapper = (children: React.ReactNode, position: ContentPosition = 'center') => {
    const getPositionStyles = () => {
      switch (position) {
        case 'left':
          return 'items-center justify-start pl-16';
        case 'right':
          return 'items-center justify-end pr-16';
        case 'top':
          return 'items-start justify-center pt-16';
        case 'bottom':
          return 'items-end justify-center pb-16';
        default:
          return 'items-center justify-center';
      }
    };

    const zClass = rpgModeActive ? 'z-40' : 'z-10';

    return (
      <div className={`absolute inset-0 ${zClass}`} style={{ padding: '40px' }}>
        <CRTOverlayStyles phosphorColor={phosphorColor}>
          <div className={`w-full h-full flex ${getPositionStyles()}`}>
            {rpgModeActive ? (
              <div className="bg-black/80 rounded-lg border border-white/10 p-4 max-h-full overflow-auto">
                {children}
              </div>
            ) : (
              children
            )}
          </div>
        </CRTOverlayStyles>
      </div>
    );
  };

  // Priority -1: Visual Storytelling (highest priority — takes over entire screen)
  if (activeStoryQuestion) {
    const storyState = useStorytellingStore.getState();
    return (
      <div className="absolute inset-0 z-15">
        <StorytellingOrchestrator
          key={activeStoryQuestion}
          question={activeStoryQuestion}
          width={size.width}
          height={size.height}
          onClose={() => clearVisualStory()}
          narrationScript={storyState.narrationScript}
          researchContext={storyState.researchContext}
        />
      </div>
    );
  }

  // Priority 0: Code display
  if (codeDisplayState.active) {
    // Fullscreen: fill entire CRT screen — no padding, no wrapper, no popup overlay
    if (codeDisplayState.fullscreen) {
      return (
        <div className="absolute inset-0 z-40">
          <Voice31CodeDisplay
            codeState={codeDisplayState}
            phosphorColor={phosphorColor}
            width={size.width}
            height={size.height}
          />
        </div>
      );
    }

    // Non-fullscreen: sized panel positioned left
    const codeWidth = Math.max(480, Math.min(size.width * 0.75, 900));
    const codeHeight = Math.max(360, Math.min(size.height * 0.8, 600));

    return contentWrapper(
      <div style={{ width: codeWidth, height: codeHeight }}>
        <Voice31CodeDisplay
          codeState={codeDisplayState}
          phosphorColor={phosphorColor}
          width={codeWidth}
          height={codeHeight}
        />
      </div>,
      'left'
    );
  }

  // Priority 0.5: Weather display
  if (weatherDisplay.active && weatherDisplay.data) {
    const weatherWidth = Math.max(400, Math.min(size.width * 0.75, 700));
    const weatherHeight = Math.max(300, Math.min(size.height * 0.8, 500));

    return contentWrapper(
      <WeatherDisplay
        data={weatherDisplay.data}
        phosphorColor={phosphorColor}
        width={weatherWidth}
        height={weatherHeight}
      />,
      'center'
    );
  }

  // Weather loading state
  if (weatherDisplay.active && weatherDisplay.isLoading) {
    return contentWrapper(
      <div className="w-full max-w-md h-full max-h-[60%] flex items-center justify-center font-mono">
        <div className="text-center" style={{ color: phosphorHex }}>
          <div className="text-3xl mb-4 animate-pulse" style={{ textShadow: `0 0 15px ${phosphorHex}60` }}>☁</div>
          <div className="text-sm uppercase tracking-[0.3em] opacity-70">Checking weather...</div>
        </div>
      </div>,
      'center'
    );
  }

  // Priority 1: Browser content (loading, reader mode, or search results)
  if (browserState.mode === 'loading') {
    return contentWrapper(
      <div className="w-full max-w-2xl h-full max-h-[80%] flex items-center justify-center font-mono">
        <div className="text-center" style={{ color: phosphorHex }}>
          <div className="text-3xl mb-4 animate-pulse" style={{ textShadow: `0 0 15px ${phosphorHex}60` }}>◎</div>
          <div className="text-sm uppercase tracking-[0.3em] opacity-70">Fetching article...</div>
          <div className="mt-3 h-0.5 w-32 mx-auto overflow-hidden rounded" style={{ background: `${phosphorHex}20` }}>
            <div
              className="h-full rounded animate-pulse"
              style={{ background: phosphorHex, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>,
      'left'
    );
  }

  if (browserState.mode === 'reader' && browserState.readerContent) {
    return contentWrapper(
      <div className="w-full max-w-2xl h-full max-h-[80%]">
        <Voice31ReaderView
          content={browserState.readerContent}
          mode="reader"
          phosphorColor={phosphorHex}
          className="h-full"
        />
      </div>,
      'left'
    );
  }

  if (browserState.mode === 'results' && browserState.searchResults.length > 0) {
    return contentWrapper(
      <div className="w-full max-w-2xl h-full max-h-[80%]">
        <Voice31ReaderView
          searchResults={browserState.searchResults}
          mode="results"
          phosphorColor={phosphorHex}
          onResultClick={handleSearchResultClick}
          className="h-full"
        />
      </div>,
      'left'
    );
  }

  // Priority 2: Progressive diagram
  if (diagramState.active) {
    return contentWrapper(
      <Voice31ProgressiveDiagram
        state={diagramState}
        phosphorColor={phosphorColor}
        width={diagramWidth}
        height={diagramHeight}
      />,
      'left'
    );
  }

  // Show list overlay
  if (displayContent.type === 'list' && displayContent.list) {
    return contentWrapper(
      <DynamicList
        items={displayContent.list}
        title={displayContent.listTitle}
        phosphorColor={phosphorColor}
      />,
      'left'
    );
  }

  // Show image/generating overlay — SKIP in RPG mode
  if ((displayContent.type === 'image' || displayContent.type === 'generating') && !rpgModeActive) {
    return (
      <div className="absolute inset-0 z-10">
        <ImageDisplay
          imageUrl={displayContent.imageUrl}
          prompt={displayContent.imagePrompt}
          isGenerating={displayContent.type === 'generating'}
          phosphorColor={phosphorColor}
        />
      </div>
    );
  }

  // Show procedural visualization
  if (displayContent.type === 'visualization' && displayContent.visualizationType) {
    return contentWrapper(
      <ProceduralVisualization
        type={displayContent.visualizationType}
        title={displayContent.visualizationTitle}
        phosphorColor={phosphorColor}
      />,
      'left'
    );
  }

  // Show kinetic typography for text content — SKIP in RPG mode
  if (displayContent.type === 'text' && displayContent.text && !rpgModeActive) {
    return (
      <div className="absolute inset-0 z-10 pointer-events-none">
        <KineticTypographyRenderer
          text={displayContent.text}
          isActive={true}
          width={size.width}
          height={size.height}
          color={phosphorColor as any}
          fontSize={Math.max(40, Math.min(72, size.width / 12))}
          keyPhrasesOnly={true}
          intensityThreshold={0.30}
        />
      </div>
    );
  }

  // Default: No explicit content — but check for recent upload notifications
  const recentUpload = uploads.length > 0 ? uploads[0] : null;
  const isRecent = recentUpload && Date.now() - recentUpload.uploadedAt < 15000;

  if (isRecent && recentUpload) {
    return (
      <UploadNotification upload={recentUpload} hex={phosphorHex} />
    );
  }

  return null;
};

/** Brief CRT-styled notification for recent uploads */
const UploadNotification: React.FC<{
  upload: { filename: string; contentType: string | null; keywords: string[] };
  hex: string;
}> = ({ upload, hex }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const badge = upload.contentType?.slice(0, 4).toUpperCase() || '???';

  return (
    <div
      className="absolute top-4 right-4 z-50 font-mono rounded px-3 py-2 max-w-[200px]"
      style={{
        background: '#0a0a0a',
        border: `1px solid ${hex}30`,
        boxShadow: `0 0 12px ${hex}10`,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div className="text-[8px] uppercase tracking-[0.2em] mb-1" style={{ color: `${hex}60` }}>
        Upload Analyzed
      </div>
      <div className="text-[9px] truncate" style={{ color: `${hex}90` }}>
        {upload.filename}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span
          className="text-[7px] px-1 rounded uppercase"
          style={{ color: '#000', background: hex }}
        >
          {badge}
        </span>
        {upload.keywords.slice(0, 3).map((kw, i) => (
          <span
            key={i}
            className="text-[7px] px-0.5"
            style={{ color: `${hex}40` }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
};
