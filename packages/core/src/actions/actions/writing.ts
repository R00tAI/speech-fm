/**
 * Writing Action
 *
 * Triggered when creating/updating notes.
 * Props: pencil with wobble animation
 * Pose: downward gaze, slight head tilt
 */

import { registerAction } from '../registry';
import type { ActionProp } from '../types';

const pencil: ActionProp = {
  id: 'writing-pencil',
  offsetX: 55,
  offsetY: 30,
  enterDuration: 350,
  exitDuration: 200,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress;
    const time = Date.now() * 0.001 * variation.speed;

    // Wobble while writing
    const wobbleX = Math.sin(time * 8) * 2 * s * progress;
    const wobbleY = Math.cos(time * 6) * 1.5 * s * progress;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x + wobbleX, y + wobbleY);
    ctx.rotate(-0.6 + variation.rotation); // Angled like held in hand

    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5 * s;

    // Pencil body
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -30 * s);
    ctx.stroke();

    // Pencil tip (triangle)
    ctx.beginPath();
    ctx.moveTo(-3 * s, 0);
    ctx.lineTo(3 * s, 0);
    ctx.lineTo(0, 6 * s);
    ctx.closePath();
    ctx.stroke();

    // Eraser end
    ctx.beginPath();
    ctx.moveTo(-3 * s, -30 * s);
    ctx.lineTo(3 * s, -30 * s);
    ctx.lineTo(3 * s, -34 * s);
    ctx.lineTo(-3 * s, -34 * s);
    ctx.closePath();
    ctx.stroke();

    // Writing trail dots
    const dotCount = Math.floor(progress * 3);
    ctx.lineWidth = 1 * s;
    for (let i = 0; i < dotCount; i++) {
      const dx = 8 + i * 6;
      const dy = 10 + Math.sin(time * 4 + i) * 2;
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, 1 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

registerAction({
  activity: 'writing',
  props: [pencil],
  pose: {
    gazeX: 2,
    gazeY: 4,
    headTilt: -0.08,
    mouth: '─═─',
  },
  styleVariants: 1,
  minDuration: 1500,
});
