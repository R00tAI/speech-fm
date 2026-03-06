/**
 * Presenting Action
 *
 * Triggered when showing images, diagrams, visual stories.
 * Props: forward gesture / pointer
 * Pose: wide eyes, confident expression
 */

import { registerAction } from '../registry';
import type { ActionProp } from '../types';

const pointer: ActionProp = {
  id: 'presenting-pointer',
  offsetX: 60,
  offsetY: 10,
  enterDuration: 300,
  exitDuration: 200,
  draw: (ctx, x, y, scale, progress, variation) => {
    const s = scale * variation.scaleMultiplier;
    const alpha = progress;
    const time = Date.now() * 0.001 * variation.speed;

    // Subtle pointing gesture
    const bobY = Math.sin(time * 1.5) * 3 * s;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y + bobY);
    ctx.rotate(variation.rotation);

    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5 * s;

    // Hand shape — simplified pointing gesture
    // Index finger
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18 * s, -8 * s);
    ctx.stroke();

    // Knuckle curve
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4 * s, 6 * s, 2 * s, 10 * s);
    ctx.stroke();

    // Arrow tip at finger end
    ctx.beginPath();
    ctx.moveTo(18 * s, -8 * s);
    ctx.lineTo(14 * s, -12 * s);
    ctx.moveTo(18 * s, -8 * s);
    ctx.lineTo(14 * s, -4 * s);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  },
};

registerAction({
  activity: 'presenting',
  props: [pointer],
  pose: {
    leftEye: '◉',
    rightEye: '◉',
    mouth: '╔═╗',
  },
  styleVariants: 1,
  minDuration: 1000,
});
