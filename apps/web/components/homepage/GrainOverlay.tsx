'use client';

/**
 * Full-screen SVG noise grain overlay.
 * Pure CSS/SVG — no JS animation loop.
 */
export const GrainOverlay = () => (
  <div
    className="fixed inset-0 z-50 pointer-events-none"
    style={{ mixBlendMode: 'overlay' }}
  >
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="0.18" />
    </svg>
  </div>
);
