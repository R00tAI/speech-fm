'use client';

import { motion } from 'framer-motion';
import {
  FilmSlate,
  Sword,
  MagnifyingGlass,
  Terminal,
  ChatCircle,
  ShieldCheck,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

const AMBER = '#c38839';
const OFF_WHITE = '#e8e6e1';

interface Feature {
  icon: Icon;
  title: string;
  copy: string;
}

const FEATURES: Feature[] = [
  {
    icon: FilmSlate,
    title: 'CINEMATIC STORIES',
    copy: 'Visual scenes generated as you talk. Depth maps, 3D cameras, atmosphere.',
  },
  {
    icon: Sword,
    title: 'RPG MODE',
    copy: 'Full game master. Persistent worlds, NPCs, character sheets. Talk to play.',
  },
  {
    icon: MagnifyingGlass,
    title: 'DEEP RESEARCH',
    copy: 'Web research, source synthesis, instant visual presentation.',
  },
  {
    icon: Terminal,
    title: 'LIVE CODE',
    copy: 'Real-time code gen + execution. Canvas, WebGL, Three.js.',
  },
  {
    icon: ChatCircle,
    title: 'TEXT + VOICE',
    copy: 'Type or talk. Switch mid-conversation. Same context.',
  },
  {
    icon: ShieldCheck,
    title: 'HONEST AI',
    copy: "Pushes back when you're wrong. No hallucinated confidence.",
  },
];

export const FeatureGrid = () => (
  <section className="relative px-6 py-28 max-w-4xl mx-auto">
    {/* Section header */}
    <motion.div
      className="mb-14"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
    >
      <h2
        className="font-mono text-xs uppercase tracking-[0.2em] pb-2"
        style={{
          color: AMBER,
          borderBottom: `2px solid ${AMBER}`,
          display: 'inline-block',
        }}
      >
        WHAT IT DOES
      </h2>
    </motion.div>

    {/* Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {FEATURES.map((feat, i) => {
        const Icon = feat.icon;
        return (
          <motion.div
            key={feat.title}
            className="p-5"
            style={{
              border: `3px solid ${AMBER}`,
              background: 'rgba(195, 136, 57, 0.03)',
            }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex items-start gap-4">
              <Icon
                size={22}
                weight="bold"
                style={{ color: AMBER, flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <h3
                  className="font-mono text-[11px] uppercase tracking-[0.15em] mb-2"
                  style={{ color: OFF_WHITE }}
                >
                  {feat.title}
                </h3>
                <p
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: `${OFF_WHITE}80` }}
                >
                  {feat.copy}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </section>
);
