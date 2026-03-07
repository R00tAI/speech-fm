'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Microphone, CaretDown } from '@phosphor-icons/react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const AMBER = '#c38839';
const OFF_WHITE = '#e8e6e1';

export const Hero = () => {
  const { isSignedIn } = useUser();
  const clerk = useClerk();
  const router = useRouter();

  const handleEnter = useCallback(() => {
    if (isSignedIn) {
      router.push('/app');
    } else {
      clerk.openSignIn({ forceRedirectUrl: '/app' });
    }
  }, [isSignedIn, clerk, router]);

  const scrollDown = useCallback(() => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Top-left wordmark */}
      <motion.div
        className="absolute top-8 left-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <span
          className="font-mono text-xs uppercase tracking-[0.15em]"
          style={{ color: AMBER }}
        >
          SPEECH.FM
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="font-sans font-bold text-5xl md:text-7xl text-center leading-[1.05] mb-6"
        style={{ color: OFF_WHITE }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
      >
        Talk. It builds.
      </motion.h1>

      {/* Subtext */}
      <motion.p
        className="font-sans text-base md:text-lg text-center max-w-lg mb-14 leading-relaxed"
        style={{ color: `${OFF_WHITE}99` }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
      >
        Voice-first AI that generates cinematic worlds in real time.
        <br className="hidden md:block" />
        No waiting. No faking it.
      </motion.p>

      {/* Call button */}
      <motion.div
        className="relative flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
      >
        {/* Sonar pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="sonar-ring sonar-ring-1" />
          <span className="sonar-ring sonar-ring-2" />
        </div>

        <button
          onClick={handleEnter}
          className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            border: `3px solid ${AMBER}`,
            background: 'rgba(195, 136, 57, 0.06)',
          }}
        >
          <Microphone size={40} weight="bold" style={{ color: AMBER }} />
        </button>

        <span
          className="font-mono text-xs uppercase tracking-[0.25em]"
          style={{ color: AMBER }}
        >
          ENTER
        </span>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollDown}
        className="absolute bottom-10 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4, y: [0, 6, 0] }}
        transition={{
          opacity: { delay: 1.5, duration: 0.6 },
          y: { delay: 1.5, duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <CaretDown size={24} style={{ color: OFF_WHITE }} />
      </motion.button>

      <style jsx>{`
        .sonar-ring {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 1.5px solid ${AMBER};
          opacity: 0;
        }
        .sonar-ring-1 {
          animation: sonar 3s ease-out infinite;
        }
        .sonar-ring-2 {
          animation: sonar 3s ease-out 1.5s infinite;
        }
        @keyframes sonar {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
};
