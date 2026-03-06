/**
 * Browsing Action
 *
 * Triggered when using browser automation tools.
 * Props: cursor pointer
 * Pose: tracking eyes that follow the cursor
 */

import { registerAction } from '../registry';
import type { ActionProp } from '../types';

const cursor: ActionProp = {
  id: 'browsing-cursor',
  offsetX: 50,
  offsetY: -15,
  enterDuration: 250,
  exitDuration: 150,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress;
    const time = Date.now() * 0.001 * variation.speed;

    // Cursor moves around like navigating a page
    const moveX = Math.sin(time * 2) * 10 * s;
    const moveY = Math.cos(time * 1.5) * 8 * s;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x + moveX, y + moveY);
    ctx.rotate(variation.rotation);

    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5 * s;

    // Classic arrow cursor shape
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18 * s);
    ctx.lineTo(5 * s, 14 * s);
    ctx.lineTo(9 * s, 22 * s); // Click tail
    ctx.moveTo(5 * s, 14 * s);
    ctx.lineTo(12 * s, 14 * s);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Click ripple when "clicking"
    const clickPhase = (time * 1.2) % 3;
    if (clickPhase < 0.5) {
      const rippleR = clickPhase * 16 * s;
      ctx.globalAlpha = alpha * (1 - clickPhase * 2);
      ctx.beginPath();
      ctx.arc(0, 0, rippleR, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

registerAction({
  activity: 'browsing',
  props: [cursor],
  pose: {
    eyeSpeed: 2,
    gazeX: 4,
    gazeY: -1,
  },
  styleVariants: 1,
  minDuration: 1500,
});
