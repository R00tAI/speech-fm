/**
 * Coding Action
 *
 * Triggered when generating code displays.
 * Props: terminal bracket overlay with scrolling characters
 * Pose: rapid eye animation (simulating reading code)
 */

import { registerAction } from '../registry';
import type { ActionProp } from '../types';

const terminalOverlay: ActionProp = {
  id: 'coding-terminal',
  offsetX: 0,
  offsetY: -55,
  enterDuration: 300,
  exitDuration: 200,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress * 0.7; // Slightly translucent
    const time = Date.now() * 0.001 * variation.speed;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = ctx.fillStyle;
    ctx.fillStyle = ctx.strokeStyle;

    // Angle brackets above head like a code tag
    ctx.font = `bold ${Math.round(14 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Opening tag
    const tagChars = ['<', '/', '>'];
    const scrollOffset = Math.floor(time * 3) % 8;
    const codeSnippets = ['fn()', '{...}', '</>',  '[ ]', '===', '0x1', 'async', '=> {'];
    const snippet = codeSnippets[scrollOffset];

    ctx.fillText(`{ ${snippet} }`, 0, 0);

    // Blinking cursor
    if (Math.floor(time * 3) % 2 === 0) {
      ctx.fillRect(30 * s, -6 * s, 2 * s, 12 * s);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

registerAction({
  activity: 'coding',
  props: [terminalOverlay],
  pose: {
    leftEye: '▪',
    rightEye: '▪',
    eyeSpeed: 3,
    squint: 0.15,
    mouth: '───',
  },
  styleVariants: 1,
  minDuration: 1500,
});
