/**
 * Remembering Action
 *
 * Triggered when accessing/storing memories.
 * Props: thought bubble
 * Pose: upward dreamy gaze
 */

import { registerAction } from '../registry';
import type { ActionProp } from '../types';

const thoughtBubble: ActionProp = {
  id: 'remembering-thought',
  offsetX: 45,
  offsetY: -45,
  enterDuration: 500,
  exitDuration: 300,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress * 0.8;
    const time = Date.now() * 0.001 * variation.speed;

    // Float upward gently
    const floatY = Math.sin(time * 1.2) * 3 * s;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y + floatY);

    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5 * s;

    // Main bubble (cloud shape)
    ctx.beginPath();
    ctx.arc(0, 0, 16 * s, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(10 * s, -6 * s, 10 * s, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-8 * s, -4 * s, 9 * s, 0, Math.PI * 2);
    ctx.stroke();

    // Connecting dots (trail from face to bubble)
    const dots = [
      { x: -25 * s, y: 20 * s, r: 3 * s },
      { x: -18 * s, y: 14 * s, r: 4 * s },
      { x: -10 * s, y: 8 * s, r: 5 * s },
    ];

    for (const dot of dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r * progress, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ellipsis inside bubble (thinking)
    ctx.font = `bold ${Math.round(12 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const dotPhase = Math.floor(time * 2) % 4;
    const ellipsis = '.'.repeat(Math.min(dotPhase + 1, 3));
    ctx.fillText(ellipsis, 2 * s, -2 * s);

    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

registerAction({
  activity: 'remembering',
  props: [thoughtBubble],
  pose: {
    leftEye: '◔',
    rightEye: '◔',
    gazeY: -4,
    headTilt: 0.06,
    mouth: '─═─',
  },
  styleVariants: 1,
  minDuration: 1200,
});
