'use client';

/**
 * Binary Assistant Character
 *
 * Animated ASCII/binary assistant that moves around the CRT display,
 * making room for content. Features expressive eyes and motion effects.
 *
 * Action Library integration: subscribes to assistantActivity from store,
 * renders contextual props (glasses, pencil, magnifier, etc.) and applies
 * pose modifiers (eye overrides, head tilt, gaze shifts).
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { useVoice31Store } from './Voice31Store';
import { ActionController, type PoseModifier, type ActionProp, type ActionVariation } from '@/lib/speech-fm/action-library';

interface BinaryAssistantProps {
  phosphorColor: string;
  width: number;
  height: number;
  contentPosition?: 'left' | 'right' | 'center' | 'top' | 'bottom' | null;
  isThinking?: boolean;
  scale?: number;
  compact?: boolean;
}

interface AssistantState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  eyeState: 'neutral' | 'listening' | 'speaking' | 'thinking' | 'excited';
  blinkTimer: number;
  isBlinking: boolean;
  mouthFrame: number;
}

export const BinaryAssistant: React.FC<BinaryAssistantProps> = ({
  phosphorColor,
  width,
  height,
  contentPosition = null,
  isThinking = false,
  scale = 1.0,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const stateRef = useRef<AssistantState>({
    x: width * 0.7,
    y: height * 0.4,
    targetX: width * 0.7,
    targetY: height * 0.4,
    eyeState: 'neutral',
    blinkTimer: 0,
    isBlinking: false,
    mouthFrame: 0,
  });

  // Motion blur trail
  const trailRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);

  // Action library controller
  const actionControllerRef = useRef(new ActionController());

  const { isListening, isSpeaking } = useVoice31Store();

  // Subscribe to assistantActivity changes and forward to controller
  useEffect(() => {
    let prevActivity = useVoice31Store.getState().assistantActivity;
    // Forward initial state
    actionControllerRef.current.setActivity(prevActivity);

    const unsub = useVoice31Store.subscribe((state) => {
      if (state.assistantActivity !== prevActivity) {
        prevActivity = state.assistantActivity;
        actionControllerRef.current.setActivity(prevActivity);
      }
    });
    return unsub;
  }, []);

  const colors = useMemo(() => ({
    green: { r: 51, g: 255, b: 51, hex: '#33ff33', glow: 'rgba(51, 255, 51, 0.6)' },
    amber: { r: 255, g: 170, b: 0, hex: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)' },
    red: { r: 255, g: 68, b: 68, hex: '#ff4444', glow: 'rgba(255, 68, 68, 0.6)' },
    blue: { r: 68, g: 136, b: 255, hex: '#4488ff', glow: 'rgba(68, 136, 255, 0.6)' },
    white: { r: 255, g: 255, b: 255, hex: '#ffffff', glow: 'rgba(255, 255, 255, 0.6)' },
  })[phosphorColor] || { r: 255, g: 170, b: 0, hex: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)' }, [phosphorColor]);

  // Update target position based on content
  useEffect(() => {
    const state = stateRef.current;
    const margin = 80;
    const assistantWidth = 180;
    const assistantHeight = 140;

    switch (contentPosition) {
      case 'center':
        // Move to bottom right corner
        state.targetX = width - assistantWidth - margin;
        state.targetY = height - assistantHeight - margin;
        break;
      case 'left':
        // Move to right side
        state.targetX = width - assistantWidth - margin;
        state.targetY = height / 2 - assistantHeight / 2;
        break;
      case 'right':
        // Move to left side
        state.targetX = margin;
        state.targetY = height / 2 - assistantHeight / 2;
        break;
      case 'top':
        // Move to bottom
        state.targetX = width / 2 - assistantWidth / 2;
        state.targetY = height - assistantHeight - margin;
        break;
      case 'bottom':
        // Move to top
        state.targetX = width / 2 - assistantWidth / 2;
        state.targetY = margin;
        break;
      default:
        // Default position - float around in idle
        if (isThinking) {
          // Thinking: gentle upward drift (looking at "the cloud")
          const t = Date.now() * 0.001;
          state.targetX = width * 0.5 + Math.sin(t * 0.8) * 30;
          state.targetY = height * 0.3 + Math.cos(t * 0.6) * 15;
        } else if (!isListening && !isSpeaking) {
          // Gentle idle movement
          const time = Date.now() * 0.001;
          state.targetX = width * 0.6 + Math.sin(time * 0.5) * 50;
          state.targetY = height * 0.4 + Math.cos(time * 0.3) * 30;
        } else {
          // Center when active
          state.targetX = width * 0.65;
          state.targetY = height * 0.35;
        }
    }

    // Update eye state
    if (isSpeaking) {
      state.eyeState = 'speaking';
    } else if (isThinking) {
      state.eyeState = 'thinking';
    } else if (isListening) {
      state.eyeState = 'listening';
    } else {
      state.eyeState = 'neutral';
    }
  }, [contentPosition, width, height, isListening, isSpeaking, isThinking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    let time = 0;

    const s = scale;

    const drawEyes = (x: number, y: number, state: AssistantState, pose?: PoseModifier) => {
      const eyeSpacing = 35 * s;
      const eyeSize = 16 * s;

      // Squint: reduce socket height
      const squintFactor = pose?.squint ? 1 - pose.squint * 0.4 : 1;

      // Draw eye backgrounds (sockets)
      ctx.fillStyle = `rgba(0, 0, 0, 0.8)`;
      ctx.fillRect(x - eyeSpacing - eyeSize, y - eyeSize * squintFactor, eyeSize * 2, eyeSize * 2 * squintFactor);
      ctx.fillRect(x + eyeSpacing - eyeSize, y - eyeSize * squintFactor, eyeSize * 2, eyeSize * 2 * squintFactor);

      // Eye content based on state
      ctx.font = `bold ${Math.round(20 * s)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 10 * s;

      // Gaze offset from pose
      const gazeX = (pose?.gazeX || 0) * s;
      const gazeY = (pose?.gazeY || 0) * s;

      if (state.isBlinking) {
        // Closed eyes
        ctx.fillStyle = colors.hex;
        ctx.fillText('─', x - eyeSpacing + gazeX, y + gazeY);
        ctx.fillText('─', x + eyeSpacing + gazeX, y + gazeY);
      } else {
        // Start with defaults, then allow pose override
        let leftEye = '●';
        let rightEye = '●';

        // Action pose eye overrides take priority when no base state demands attention
        const eyeSpeed = pose?.eyeSpeed || 1;
        const useActionEyes = pose?.leftEye && (state.eyeState === 'neutral' || state.eyeState === 'thinking');

        switch (state.eyeState) {
          case 'listening':
            // Wide open, attentive
            leftEye = '◉';
            rightEye = '◉';
            break;
          case 'speaking':
            // Animated speaking eyes
            const speakFrame = Math.floor(time * 8 * eyeSpeed) % 4;
            leftEye = ['◉', '●', '◉', '◎'][speakFrame];
            rightEye = ['◉', '●', '◉', '◎'][speakFrame];
            break;
          case 'thinking':
            leftEye = useActionEyes ? pose!.leftEye! : '◔';
            rightEye = useActionEyes ? pose!.rightEye! : '◔';
            break;
          case 'excited':
            leftEye = '★';
            rightEye = '★';
            break;
          default:
            if (useActionEyes) {
              leftEye = pose!.leftEye!;
              rightEye = pose!.rightEye || pose!.leftEye!;
            } else {
              // Subtle animation
              const idleFrame = Math.floor(time * 2 * eyeSpeed) % 3;
              leftEye = ['●', '●', '◉'][idleFrame];
              rightEye = ['●', '●', '◉'][idleFrame];
            }
        }

        ctx.fillStyle = colors.hex;
        ctx.fillText(leftEye, x - eyeSpacing + gazeX, y + gazeY);
        ctx.fillText(rightEye, x + eyeSpacing + gazeX, y + gazeY);
      }

      ctx.shadowBlur = 0;
    };

    const drawMouth = (x: number, y: number, state: AssistantState, pose?: PoseModifier) => {
      ctx.font = `bold ${Math.round(16 * s)}px monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 8 * s;
      ctx.fillStyle = colors.hex;

      let mouth = '═══';

      if (state.eyeState === 'thinking') {
        // Gentle contemplation wobble
        const wobble = Math.sin(time * 3) * 2 * s;
        mouth = pose?.mouth || '─═─';
        ctx.fillText(mouth, x + wobble, y + 35 * s);
        ctx.shadowBlur = 0;
        return;
      } else if (state.eyeState === 'speaking') {
        const mouthFrames = ['═══', '┌─┐', '╔═╗', '┌─┐', '═══', '╚═╝'];
        mouth = mouthFrames[Math.floor(time * 12) % mouthFrames.length];
      } else if (state.eyeState === 'listening') {
        mouth = '───';
      } else if (state.eyeState === 'excited') {
        mouth = '╔═╗';
      } else if (pose?.mouth) {
        // Action pose mouth override for neutral state
        mouth = pose.mouth;
      }

      ctx.fillText(mouth, x, y + 35 * s);
      ctx.shadowBlur = 0;
    };

    const drawBinaryAura = (x: number, y: number) => {
      ctx.font = `${Math.round(10 * s)}px monospace`;
      ctx.textAlign = 'center';
      const binaryChars = '01';

      // Floating binary particles (fewer when compact)
      const particleCount = compact ? 10 : 20;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.5;
        const radius = (60 + Math.sin(time * 2 + i) * 15) * s;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius * 0.6;

        const alpha = 0.2 + Math.sin(time * 3 + i * 0.5) * 0.15;

        ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${alpha})`;
        ctx.fillText(binaryChars[Math.floor(time * 5 + i) % 2], px, py);
      }
    };

    const drawFace = (x: number, y: number, state: AssistantState, pose?: PoseModifier) => {
      // Apply head tilt from action pose
      const headTilt = pose?.headTilt || 0;
      if (headTilt) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(headTilt);
        ctx.translate(-x, -y);
      }

      // Face frame
      ctx.strokeStyle = colors.hex;
      ctx.lineWidth = 2 * s;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 15 * s;

      // Rounded rectangle face
      const faceWidth = 120 * s;
      const faceHeight = 80 * s;
      const radius = 15 * s;

      ctx.beginPath();
      ctx.moveTo(x - faceWidth / 2 + radius, y - faceHeight / 2);
      ctx.lineTo(x + faceWidth / 2 - radius, y - faceHeight / 2);
      ctx.quadraticCurveTo(x + faceWidth / 2, y - faceHeight / 2, x + faceWidth / 2, y - faceHeight / 2 + radius);
      ctx.lineTo(x + faceWidth / 2, y + faceHeight / 2 - radius);
      ctx.quadraticCurveTo(x + faceWidth / 2, y + faceHeight / 2, x + faceWidth / 2 - radius, y + faceHeight / 2);
      ctx.lineTo(x - faceWidth / 2 + radius, y + faceHeight / 2);
      ctx.quadraticCurveTo(x - faceWidth / 2, y + faceHeight / 2, x - faceWidth / 2, y + faceHeight / 2 - radius);
      ctx.lineTo(x - faceWidth / 2, y - faceHeight / 2 + radius);
      ctx.quadraticCurveTo(x - faceWidth / 2, y - faceHeight / 2, x - faceWidth / 2 + radius, y - faceHeight / 2);
      ctx.closePath();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Draw eyes and mouth with pose modifiers
      drawEyes(x, y - 10 * s, state, pose);
      drawMouth(x, y, state, pose);

      if (headTilt) {
        ctx.restore();
      }
    };

    const drawActionProps = (
      x: number,
      y: number,
      props: ActionProp[],
      variation: ActionVariation,
      progress: number,
    ) => {
      if (progress <= 0 || props.length === 0) return;

      ctx.save();
      ctx.fillStyle = colors.hex;
      ctx.strokeStyle = colors.hex;

      for (const prop of props) {
        const propX = x + prop.offsetX * s;
        const propY = y + prop.offsetY * s;
        prop.draw(ctx, propX, propY, s, progress, variation);
      }

      ctx.restore();
    };

    const animate = () => {
      time += 0.016;
      const state = stateRef.current;

      // Update blink timer
      state.blinkTimer += 0.016;
      if (state.blinkTimer > 3 + Math.random() * 2) {
        state.isBlinking = true;
        setTimeout(() => {
          state.isBlinking = false;
        }, 150);
        state.blinkTimer = 0;
      }

      // Smooth movement with easing
      const dx = state.targetX - state.x;
      const dy = state.targetY - state.y;
      const speed = 0.03;
      state.x += dx * speed;
      state.y += dy * speed;

      // Add to motion trail (shorter trail when compact)
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxTrail = compact ? 4 : 8;
      if (distance > 2) {
        trailRef.current.unshift({ x: state.x, y: state.y, alpha: 0.6 });
        if (trailRef.current.length > maxTrail) {
          trailRef.current.pop();
        }
      }

      // Fade trail
      trailRef.current = trailRef.current.map(t => ({ ...t, alpha: t.alpha * 0.85 })).filter(t => t.alpha > 0.05);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw motion blur trail with chromatic aberration
      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const trail = trailRef.current[i];
        const aberration = (trailRef.current.length - i) * 2 * s;

        // Red channel offset
        ctx.globalAlpha = trail.alpha * 0.3;
        ctx.fillStyle = `rgba(${Math.min(255, colors.r + 50)}, 0, 0, 1)`;
        ctx.beginPath();
        ctx.arc(trail.x - aberration, trail.y, 40 * s, 0, Math.PI * 2);
        ctx.fill();

        // Blue channel offset
        ctx.fillStyle = `rgba(0, 0, ${Math.min(255, colors.b + 50)}, 1)`;
        ctx.beginPath();
        ctx.arc(trail.x + aberration, trail.y, 40 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // Draw binary aura
      drawBinaryAura(state.x, state.y);

      // Get action pose & props from controller
      const now = Date.now();
      const actionState = actionControllerRef.current.update(now);
      const { pose, props, variation, propProgress } = actionState;

      // Draw face with chromatic aberration effect when moving fast
      if (distance > 10) {
        // Chromatic aberration on fast movement
        ctx.globalAlpha = 0.3;
        ctx.save();
        ctx.translate(-3, 0);
        ctx.fillStyle = `rgba(255, 0, 0, 0.5)`;
        drawFace(state.x, state.y, state, pose);
        ctx.restore();

        ctx.save();
        ctx.translate(3, 0);
        ctx.fillStyle = `rgba(0, 255, 255, 0.5)`;
        drawFace(state.x, state.y, state, pose);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Main face (with action pose applied)
      drawFace(state.x, state.y, state, pose);

      // Draw action props (after face, before bloom)
      drawActionProps(state.x, state.y, props, variation, propProgress);

      // Bloom effect
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = colors.glow;
      ctx.filter = `blur(${Math.round(20 * s)}px)`;
      ctx.beginPath();
      ctx.arc(state.x, state.y, 50 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [width, height, colors, isListening, isSpeaking, isThinking, scale, compact]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-5"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default BinaryAssistant;
