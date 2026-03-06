'use client';

import React, { useState, useEffect } from 'react';
import { List } from '@phosphor-icons/react';

/**
 * Animated list renderer with CRT-style phosphor glow.
 * Items reveal one-by-one with slide-in animation.
 */

interface DynamicListProps {
  items: string[];
  title?: string;
  phosphorColor: string;
}

export const DynamicList: React.FC<DynamicListProps> = ({ items, title, phosphorColor }) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    setVisibleItems([]);
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, 200 + index * 150);
    });
  }, [items]);

  const colors = {
    green: { text: '#33ff33', glow: 'rgba(51, 255, 51, 0.5)' },
    amber: { text: '#ffaa00', glow: 'rgba(255, 170, 0, 0.5)' },
    red: { text: '#ff4444', glow: 'rgba(255, 68, 68, 0.5)' },
    blue: { text: '#4488ff', glow: 'rgba(68, 136, 255, 0.5)' },
    white: { text: '#ffffff', glow: 'rgba(255, 255, 255, 0.5)' },
  }[phosphorColor] || { text: '#ffaa00', glow: 'rgba(255, 170, 0, 0.5)' };

  return (
    <div className="w-full max-w-lg font-mono p-6">
      {title && (
        <div
          className="flex items-center gap-3 mb-6 text-xl font-bold tracking-wider"
          style={{
            color: colors.text,
            textShadow: `0 0 15px ${colors.glow}`,
          }}
        >
          <List weight="bold" className="w-6 h-6" />
          <span>{title.toUpperCase()}</span>
        </div>
      )}
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-4 transition-all duration-500"
            style={{
              opacity: visibleItems.includes(index) ? 1 : 0,
              transform: visibleItems.includes(index)
                ? 'translateX(0)'
                : 'translateX(-30px)',
              color: colors.text,
              textShadow: `0 0 8px ${colors.glow}`,
            }}
          >
            <span
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2"
              style={{
                borderColor: colors.text,
                backgroundColor: `${colors.text}20`,
              }}
            >
              {index + 1}
            </span>
            <span className="text-lg leading-relaxed pt-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
