/**
 * Reading Action
 *
 * Triggered when fetching/reading articles.
 * Props: glasses (3 style variants) + book
 * Pose: squinted eyes, slight downward gaze
 */

import { registerAction } from '../registry';
import type { ActionProp, ActionVariation } from '../types';

const glasses: ActionProp = {
  id: 'reading-glasses',
  offsetX: 0,
  offsetY: -12,
  enterDuration: 400,
  exitDuration: 250,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ctx.fillStyle; // inherits phosphor color set by caller
    ctx.lineWidth = 1.5 * s;

    const style = variation.styleIndex;

    if (style === 0) {
      // Round glasses
      const r = 12 * s;
      ctx.beginPath();
      ctx.arc(x - 18 * s, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 18 * s, y, r, 0, Math.PI * 2);
      ctx.stroke();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(x - 6 * s, y);
      ctx.lineTo(x + 6 * s, y);
      ctx.stroke();
      // Temples
      ctx.beginPath();
      ctx.moveTo(x - 30 * s, y);
      ctx.lineTo(x - 40 * s, y - 4 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 30 * s, y);
      ctx.lineTo(x + 40 * s, y - 4 * s);
      ctx.stroke();
    } else if (style === 1) {
      // Rectangular glasses
      const w = 22 * s;
      const h = 14 * s;
      ctx.strokeRect(x - 18 * s - w / 2, y - h / 2, w, h);
      ctx.strokeRect(x + 18 * s - w / 2, y - h / 2, w, h);
      // Bridge
      ctx.beginPath();
      ctx.moveTo(x - 7 * s, y);
      ctx.lineTo(x + 7 * s, y);
      ctx.stroke();
    } else {
      // Half-moon reading glasses
      const r = 13 * s;
      ctx.beginPath();
      ctx.arc(x - 18 * s, y + 2 * s, r, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 18 * s, y + 2 * s, r, 0, Math.PI);
      ctx.stroke();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(x - 5 * s, y + 2 * s);
      ctx.lineTo(x + 5 * s, y + 2 * s);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  },
};

const book: ActionProp = {
  id: 'reading-book',
  offsetX: -50,
  offsetY: 40,
  enterDuration: 500,
  exitDuration: 300,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress;
    const openAngle = progress * 0.3; // Book opens as it enters

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(variation.rotation);

    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5 * s;

    // Left page
    ctx.save();
    ctx.rotate(-openAngle);
    ctx.strokeRect(-20 * s, -14 * s, 20 * s, 28 * s);
    // Page lines
    ctx.lineWidth = 0.5 * s;
    for (let i = 0; i < 5; i++) {
      const ly = -10 * s + i * 5 * s;
      ctx.beginPath();
      ctx.moveTo(-18 * s, ly);
      ctx.lineTo(-4 * s, ly);
      ctx.stroke();
    }
    ctx.restore();

    // Right page
    ctx.save();
    ctx.rotate(openAngle);
    ctx.strokeRect(0, -14 * s, 20 * s, 28 * s);
    ctx.lineWidth = 0.5 * s;
    for (let i = 0; i < 5; i++) {
      const ly = -10 * s + i * 5 * s;
      ctx.beginPath();
      ctx.moveTo(4 * s, ly);
      ctx.lineTo(18 * s, ly);
      ctx.stroke();
    }
    ctx.restore();

    // Spine
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(0, -14 * s);
    ctx.lineTo(0, 14 * s);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

registerAction({
  activity: 'reading',
  props: [glasses, book],
  pose: {
    leftEye: '◔',
    rightEye: '◔',
    squint: 0.2,
    gazeY: 3,
    headTilt: -0.05,
  },
  styleVariants: 3,
  minDuration: 2000,
});
