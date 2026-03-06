/**
 * Searching Action
 *
 * Triggered when searching the web.
 * Props: magnifying glass with sweep motion
 * Pose: scanning eyes (alternating gaze)
 */

import { registerAction } from '../registry';
import type { ActionProp } from '../types';

const magnifyingGlass: ActionProp = {
  id: 'searching-magnifier',
  offsetX: 50,
  offsetY: -10,
  enterDuration: 350,
  exitDuration: 200,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress;
    const time = Date.now() * 0.001 * variation.speed;

    // Sweep motion — glass moves left-right while searching
    const sweepX = Math.sin(time * 2.5) * 12 * s * progress;
    const sweepY = Math.cos(time * 1.8) * 4 * s * progress;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x + sweepX, y + sweepY);
    ctx.rotate(0.3 + variation.rotation);

    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2 * s;

    // Lens circle
    const lensR = 14 * s;
    ctx.beginPath();
    ctx.arc(0, 0, lensR, 0, Math.PI * 2);
    ctx.stroke();

    // Handle
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(lensR * 0.7, lensR * 0.7);
    ctx.lineTo(lensR * 0.7 + 16 * s, lensR * 0.7 + 16 * s);
    ctx.stroke();

    // Lens glint
    ctx.lineWidth = 1 * s;
    ctx.globalAlpha = alpha * 0.4;
    ctx.beginPath();
    ctx.arc(-4 * s, -4 * s, 4 * s, 0.3, 1.5);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

registerAction({
  activity: 'searching',
  props: [magnifyingGlass],
  pose: {
    leftEye: '◎',
    rightEye: '◉',
    eyeSpeed: 1.5,
    gazeX: 3,
  },
  styleVariants: 1,
  minDuration: 1500,
});
