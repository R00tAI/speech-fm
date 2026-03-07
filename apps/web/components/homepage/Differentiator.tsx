'use client';

import { motion } from 'framer-motion';

const AMBER = '#c38839';
const OFF_WHITE = '#e8e6e1';

const CALLOUTS = [
  'Other tools make you wait 30 minutes for a generated podcast. Speech FM builds worlds while you talk.',
  'Most voice AI is a chatbot with a microphone. This is interactive visual intelligence that responds in real time.',
  '$0 to start. No credit card. No enterprise sales call. Just talk.',
];

export const Differentiator = () => (
  <section className="relative px-6 py-28 max-w-3xl mx-auto">
    <motion.h2
      className="font-sans font-bold text-3xl md:text-5xl leading-tight mb-16"
      style={{ color: OFF_WHITE }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
    >
      NOT ANOTHER AI CHATBOT.
    </motion.h2>

    <div className="space-y-8">
      {CALLOUTS.map((text, i) => (
        <motion.div
          key={i}
          className="pl-5 py-1"
          style={{ borderLeft: `3px solid ${AMBER}` }}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
        >
          <p
            className="font-sans text-base md:text-lg leading-relaxed"
            style={{ color: `${OFF_WHITE}cc` }}
          >
            {text}
          </p>
        </motion.div>
      ))}
    </div>
  </section>
);
