'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// CRT MONITOR PRO - WebGL Shader-Based Display
// Enhanced with barrel distortion, scanlines, and thick plastic bezel
// =============================================================================

export type CRTProPhosphorColor = 'green' | 'red' | 'blue' | 'amber' | 'white';

interface PhosphorPalette {
  primary: string;
  glow: string;
  dark: string;
  background: string;
  tint: [number, number, number]; // RGB normalized for shader
}

// Enhanced phosphor palettes with shader tints
const phosphorPalettes: Record<CRTProPhosphorColor, PhosphorPalette> = {
  green: {
    primary: '#33ff33',
    glow: '#00ff00',
    dark: '#003300',
    background: '#010802',
    tint: [0.7, 1.0, 0.7],
  },
  red: {
    primary: '#ff4444',
    glow: '#ff2222',
    dark: '#330000',
    background: '#080101',
    tint: [1.0, 0.6, 0.6],
  },
  blue: {
    primary: '#4488ff',
    glow: '#3377ff',
    dark: '#001133',
    background: '#010208',
    tint: [0.6, 0.8, 1.0],
  },
  amber: {
    primary: '#ffaa00',
    glow: '#ff8800',
    dark: '#331a00',
    background: '#080401',
    tint: [1.0, 0.85, 0.6],
  },
  white: {
    primary: '#ffffff',
    glow: '#cccccc',
    dark: '#1a1a1a',
    background: '#050505',
    tint: [1.0, 1.0, 1.0],
  },
};

// =============================================================================
// WEBGL CRT SHADER CLASS
// Barrel distortion + Scanlines + Pixel grid + Vignette + Flicker
// =============================================================================

class CRTShaderEffect {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;

  // Uniform locations
  private timeLoc: WebGLUniformLocation | null = null;
  private resolutionLoc: WebGLUniformLocation | null = null;
  private barrelLoc: WebGLUniformLocation | null = null;
  private scanlineLoc: WebGLUniformLocation | null = null;
  private pixelSizeLoc: WebGLUniformLocation | null = null;
  private tintLoc: WebGLUniformLocation | null = null;

  private sourceCanvas: HTMLCanvasElement;
  private effectCanvas: HTMLCanvasElement;

  constructor(sourceCanvas: HTMLCanvasElement, effectCanvas: HTMLCanvasElement) {
    this.sourceCanvas = sourceCanvas;
    this.effectCanvas = effectCanvas;

    this.gl = effectCanvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!this.gl) {
      console.warn('WebGL not supported, falling back to CSS effects');
      return;
    }

    this.initShaders();
    this.initBuffers();
    this.initTexture();
  }

  private initShaders() {
    const gl = this.gl!;

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment shader with advanced CRT effects
    // Barrel distortion, scanlines, shadow mask, chromatic aberration,
    // rolling refresh line, noise, vignette, bloom
    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_barrelPower;
      uniform float u_scanlineIntensity;
      uniform float u_pixelSize;
      uniform vec3 u_tint;

      // Barrel distortion with chromatic aberration
      vec2 barrelDistortion(vec2 coord, float power) {
        vec2 cc = coord - 0.5;
        float dist = dot(cc, cc);
        return coord + cc * dist * power;
      }

      // Pseudo-random noise
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      // Shadow mask pattern (RGB aperture grille simulation)
      vec3 shadowMask(vec2 uv) {
        vec2 pixel = uv * u_resolution;
        float maskR = sin(pixel.x * 3.14159 * 2.0 / 3.0) * 0.5 + 0.5;
        float maskG = sin((pixel.x + 1.0) * 3.14159 * 2.0 / 3.0) * 0.5 + 0.5;
        float maskB = sin((pixel.x + 2.0) * 3.14159 * 2.0 / 3.0) * 0.5 + 0.5;
        return vec3(
          mix(0.75, 1.0, maskR),
          mix(0.75, 1.0, maskG),
          mix(0.75, 1.0, maskB)
        );
      }

      void main() {
        // Apply barrel distortion
        vec2 uvBase = barrelDistortion(v_texCoord, u_barrelPower);

        // Check if outside screen bounds (rounded corners effect)
        if (uvBase.x < 0.0 || uvBase.x > 1.0 || uvBase.y < 0.0 || uvBase.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        // Chromatic aberration - sample RGB at slightly different positions
        float aberrationAmount = 0.002 + u_barrelPower * 0.01;
        vec2 uvR = barrelDistortion(v_texCoord, u_barrelPower + aberrationAmount);
        vec2 uvG = uvBase;
        vec2 uvB = barrelDistortion(v_texCoord, u_barrelPower - aberrationAmount);

        // Pixelate for chunky CRT look
        vec2 pixelUVR = floor(uvR * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;
        vec2 pixelUVG = floor(uvG * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;
        vec2 pixelUVB = floor(uvB * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;

        // Sample texture with chromatic aberration
        float r = texture2D(u_image, pixelUVR).r;
        float g = texture2D(u_image, pixelUVG).g;
        float b = texture2D(u_image, pixelUVB).b;
        vec3 color = vec3(r, g, b);

        // Horizontal scanlines (phosphor lines with curved intensity)
        float scanlinePos = uvBase.y * u_resolution.y / u_pixelSize;
        float scanline = sin(scanlinePos * 3.14159) * 0.5 + 0.5;
        scanline = pow(scanline, 1.2);
        float scanlineEffect = mix(1.0 - u_scanlineIntensity, 1.0, scanline);
        color *= scanlineEffect;

        // Apply shadow mask (RGB aperture grille)
        vec3 mask = shadowMask(uvBase);
        color *= mix(vec3(1.0), mask, 0.25);

        // Vignette (screen curvature darkening at edges)
        vec2 vignetteUV = uvBase * 2.0 - 1.0;
        float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.3;
        vignette = pow(max(vignette, 0.0), 1.3);
        color *= vignette;

        // Rolling bright bar (CRT refresh simulation)
        float refreshLine = fract(uvBase.y - u_time * 0.15);
        float refreshBright = smoothstep(0.0, 0.015, refreshLine) * smoothstep(0.03, 0.015, refreshLine);
        color += color * refreshBright * 0.12;

        // Subtle flicker (60Hz simulation)
        float flicker = 1.0 - sin(u_time * 120.0) * 0.006;
        color *= flicker;

        // Film grain / CRT noise
        float grainAmount = 0.03;
        float grain = noise(uvBase * u_resolution + vec2(u_time * 100.0));
        color += (grain - 0.5) * grainAmount;

        // Apply phosphor tint
        color *= u_tint;

        // Bloom/glow (brighten bright areas)
        float brightness = dot(color, vec3(0.299, 0.587, 0.114));
        color += color * brightness * 0.25;

        // Subtle glow at screen edges for that CRT haze
        float edgeGlow = pow(1.0 - vignette, 3.0) * 0.15;
        color += u_tint * edgeGlow;

        // Clamp output
        color = clamp(color, 0.0, 1.0);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vs || !fs) return;

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Shader program link failed:', gl.getProgramInfoLog(this.program));
      return;
    }

    // Get uniform locations
    this.timeLoc = gl.getUniformLocation(this.program, 'u_time');
    this.resolutionLoc = gl.getUniformLocation(this.program, 'u_resolution');
    this.barrelLoc = gl.getUniformLocation(this.program, 'u_barrelPower');
    this.scanlineLoc = gl.getUniformLocation(this.program, 'u_scanlineIntensity');
    this.pixelSizeLoc = gl.getUniformLocation(this.program, 'u_pixelSize');
    this.tintLoc = gl.getUniformLocation(this.program, 'u_tint');
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private initBuffers() {
    const gl = this.gl!;

    // Full screen quad
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1
    ]);

    const texCoords = new Float32Array([
      0, 1,  1, 1,  0, 0,
      0, 0,  1, 1,  1, 0
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  }

  private initTexture() {
    const gl = this.gl!;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  render(time: number, options: {
    barrelPower?: number;
    scanlineIntensity?: number;
    pixelSize?: number;
    tint?: [number, number, number];
  } = {}) {
    const gl = this.gl;
    if (!gl || !this.program) return;

    const {
      barrelPower = 0.15,
      scanlineIntensity = 0.25,
      pixelSize = 2.5,
      tint = [1, 1, 1],
    } = options;

    // Update texture from source canvas
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.sourceCanvas);

    gl.viewport(0, 0, this.effectCanvas.width, this.effectCanvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Set attributes
    const positionLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texCoordLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    gl.uniform1f(this.timeLoc, time);
    gl.uniform2f(this.resolutionLoc, this.effectCanvas.width, this.effectCanvas.height);
    gl.uniform1f(this.barrelLoc, barrelPower);
    gl.uniform1f(this.scanlineLoc, scanlineIntensity);
    gl.uniform1f(this.pixelSizeLoc, pixelSize);
    gl.uniform3fv(this.tintLoc, tint);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    const gl = this.gl;
    if (!gl) return;

    if (this.program) gl.deleteProgram(this.program);
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
  }
}

// =============================================================================
// CRT MONITOR PRO COMPONENT PROPS
// =============================================================================

export interface CRTMonitorProProps {
  // Content
  children?: React.ReactNode;

  // Appearance
  phosphorColor?: CRTProPhosphorColor;
  width?: number;
  height?: number;

  // Shader effects
  barrelPower?: number;      // 0-0.3 (barrel distortion strength)
  scanlineIntensity?: number; // 0-0.5 (scanline darkness)
  pixelSize?: number;         // 1-4 (pixel chunkyness)

  // Bezel options
  bezel?: boolean;
  brandText?: string;

  // Power state
  powerOn?: boolean;

  // Custom content renderer
  renderContent?: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;

  className?: string;
}

// =============================================================================
// THICK PLASTIC BEZEL COMPONENT
// =============================================================================

const ThickBezel: React.FC<{
  children: React.ReactNode;
  phosphor: PhosphorPalette;
  brandText?: string;
}> = ({ children, phosphor, brandText = 'Phosphor Display Co.' }) => {
  return (
    <div className="crt-monitor-bezel relative">
      {/* Main bezel body */}
      <div
        className="relative rounded-[35px]"
        style={{
          padding: '40px 45px 55px 45px',
          background: 'linear-gradient(180deg, #3a3a3a 0%, #252525 30%, #1a1a1a 70%, #0f0f0f 100%)',
          boxShadow: `
            0 40px 80px rgba(0, 0, 0, 0.9),
            0 15px 30px rgba(0, 0, 0, 0.7),
            inset 0 1px 2px rgba(255, 255, 255, 0.15),
            inset 0 -2px 4px rgba(0, 0, 0, 0.5),
            inset 2px 0 4px rgba(255, 255, 255, 0.05),
            inset -2px 0 4px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Bezel shine/reflection */}
        <div
          className="absolute bottom-5 right-[60px] w-[150px] h-3 rounded-[50%]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent 100%)',
            filter: 'blur(3px)',
          }}
        />

        {/* Screen inset area */}
        <div
          className="relative rounded-[25px] p-[10px]"
          style={{
            background: '#000',
            boxShadow: 'inset 0 0 80px rgba(0, 0, 0, 1), inset 0 5px 15px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Screen wrapper */}
          <div className="relative rounded-[18px] overflow-hidden">
            {children}

            {/* Glass reflection overlay */}
            <div
              className="absolute inset-0 rounded-[18px] pointer-events-none z-[100]"
              style={{
                background: 'linear-gradient(155deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 25%, transparent 50%)',
              }}
            />

            {/* Moving refresh line */}
            <div
              className="absolute left-0 right-0 h-[2px] z-[101] pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.04), transparent)',
                animation: 'crt-refresh-scan 5s linear infinite',
              }}
            />
          </div>
        </div>

        {/* Power LED */}
        <div
          className="absolute bottom-[22px] right-[35px] w-2 h-2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${phosphor.primary} 0%, ${phosphor.dark} 100%)`,
            boxShadow: `0 0 12px ${phosphor.glow}, 0 0 25px ${phosphor.glow}80`,
            animation: 'crt-led-glow 2.5s ease-in-out infinite',
          }}
        />

        {/* Brand text */}
        <div
          className="absolute bottom-5 left-[45px] text-[9px] tracking-[4px] uppercase font-light"
          style={{
            color: '#444',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {brandText}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN CRT MONITOR PRO COMPONENT
// =============================================================================

export const CRTMonitorPro: React.FC<CRTMonitorProProps> = ({
  children,
  phosphorColor = 'green',
  width = 800,
  height = 520,
  barrelPower = 0.12,
  scanlineIntensity = 0.3,
  pixelSize = 2.0,
  bezel = true,
  brandText,
  powerOn = true,
  renderContent,
  className = '',
}) => {
  const contentCanvasRef = useRef<HTMLCanvasElement>(null);
  const effectCanvasRef = useRef<HTMLCanvasElement>(null);
  const shaderRef = useRef<CRTShaderEffect | null>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const phosphor = phosphorPalettes[phosphorColor];

  // Initialize WebGL shader
  useEffect(() => {
    const contentCanvas = contentCanvasRef.current;
    const effectCanvas = effectCanvasRef.current;

    if (!contentCanvas || !effectCanvas) return;

    shaderRef.current = new CRTShaderEffect(contentCanvas, effectCanvas);

    return () => {
      shaderRef.current?.dispose();
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!powerOn) return;

    const contentCanvas = contentCanvasRef.current;
    const ctx = contentCanvas?.getContext('2d');

    if (!contentCanvas || !ctx) return;

    const animate = () => {
      timeRef.current++;

      // Clear with phosphor background
      ctx.fillStyle = phosphor.background;
      ctx.fillRect(0, 0, width, height);

      // Call custom render function if provided
      if (renderContent) {
        renderContent(ctx, width, height, timeRef.current);
      }

      // Apply WebGL shader effect
      shaderRef.current?.render(timeRef.current * 0.016, {
        barrelPower,
        scanlineIntensity,
        pixelSize,
        tint: phosphor.tint,
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [powerOn, phosphor, width, height, barrelPower, scanlineIntensity, pixelSize, renderContent]);

  const screenContent = (
    <div className="relative" style={{ width, height }}>
      {/* Content canvas (hidden, rendered to) */}
      <canvas
        ref={contentCanvasRef}
        width={width}
        height={height}
        className="absolute inset-0 rounded-[15px]"
        style={{ display: 'block' }}
      />

      {/* Effect canvas (visible, with shader applied) */}
      <canvas
        ref={effectCanvasRef}
        width={width}
        height={height}
        className="absolute inset-0 rounded-[15px] pointer-events-none"
        style={{ display: 'block' }}
      />

      {/* React children overlay (positioned above canvases) */}
      {children && (
        <div
          className="absolute inset-0 z-10 font-mono"
          style={{
            color: phosphor.primary,
            textShadow: `0 0 8px ${phosphor.glow}`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );

  if (bezel) {
    return (
      <div className={className}>
        <ThickBezel phosphor={phosphor} brandText={brandText}>
          <AnimatePresence mode="wait">
            {powerOn ? (
              <motion.div
                key="on"
                initial={{ scaleY: 0.01, scaleX: 0.8, filter: 'brightness(3) blur(10px)' }}
                animate={{ scaleY: 1, scaleX: 1, filter: 'brightness(1) blur(0px)' }}
                exit={{ scaleY: 0.01, scaleX: 0.3, filter: 'brightness(3) blur(5px)' }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {screenContent}
              </motion.div>
            ) : (
              <motion.div
                key="off"
                className="flex items-center justify-center"
                style={{ width, height, background: '#000' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: phosphor.primary,
                    boxShadow: `0 0 10px ${phosphor.glow}`,
                    animation: 'crt-power-dot 2s ease-out forwards',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </ThickBezel>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[15px] ${className}`}>
      {screenContent}
    </div>
  );
};

// =============================================================================
// VOICE DISPLAY PRO COMPONENT
// Specialized for voice assistant interfaces
// =============================================================================

export interface VoiceDisplayProProps extends Omit<CRTMonitorProProps, 'renderContent' | 'children'> {
  // Voice state
  text?: string;
  isListening?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  transcript?: string;

  // Visual options
  showStatusBar?: boolean;
  showVisualizerBars?: boolean;
  visualizerData?: number[];
}

export const VoiceDisplayPro: React.FC<VoiceDisplayProProps> = ({
  text = 'READY',
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  transcript,
  showStatusBar = true,
  showVisualizerBars = true,
  visualizerData = [],
  phosphorColor = 'green',
  width = 800,
  height = 520,
  ...props
}) => {
  const phosphor = phosphorPalettes[phosphorColor];

  // Dimmed version of primary color
  const dimColor = phosphorColor === 'green' ? '#1a9a1a' :
                   phosphorColor === 'red' ? '#aa3333' :
                   phosphorColor === 'blue' ? '#2255aa' :
                   phosphorColor === 'amber' ? '#996600' : '#888888';

  const darkColor = phosphorColor === 'green' ? '#0d4d0d' :
                    phosphorColor === 'red' ? '#4d0000' :
                    phosphorColor === 'blue' ? '#001144' :
                    phosphorColor === 'amber' ? '#4d2200' : '#333333';

  // Custom render function for voice display content
  const renderContent = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const primary = phosphor.primary;
    const dim = dimColor;
    const dark = darkColor;

    // Draw glow layer (behind everything)
    ctx.save();
    ctx.filter = 'blur(20px)';
    ctx.fillStyle = `${phosphor.glow}25`;
    ctx.font = 'bold 120px Impact, Arial Black, sans-serif';
    ctx.fillText(text, w / 2 - ctx.measureText(text).width / 2, h / 2 + 40);
    ctx.restore();

    ctx.fillStyle = primary;
    ctx.strokeStyle = primary;

    // ===== MAIN BORDER FRAME =====
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    // Corner details
    const cornerSize = 15;
    [[50, 50], [w - 50 - cornerSize, 50], [50, h - 54], [w - 50 - cornerSize, h - 54]].forEach(([x, y], i) => {
      ctx.fillRect(x, y, cornerSize, 4);
      ctx.fillRect(i % 2 === 0 ? x : x + cornerSize - 4, i < 2 ? y : y - cornerSize + 4, 4, cornerSize);
    });

    // ===== HEADER STATUS =====
    ctx.font = '600 18px Consolas, Monaco, monospace';
    ctx.fillStyle = dim;
    ctx.fillText(
      isListening ? 'LISTENING...' :
      isThinking ? 'THINKING...' :
      isSpeaking ? 'PROCESSING...' :
      'STANDBY',
      70, 38
    );

    // Status LED — pulsing blue during thinking
    const thinkingPulse = isThinking ? 0.5 + 0.5 * Math.sin(time * 0.15) : 1;
    const ledColor = isListening ? '#ff4444' :
                     isThinking ? `rgba(51, 119, 255, ${thinkingPulse})` :
                     isSpeaking ? primary : dark;
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(w - 75, 30, 6, 0, Math.PI * 2);
    ctx.fill();
    if (isListening || isSpeaking || isThinking) {
      ctx.shadowColor = ledColor;
      ctx.shadowBlur = isThinking ? 20 : 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ===== LEFT SIDE MENU =====
    if (showStatusBar) {
      ctx.font = '600 16px Consolas, Monaco, monospace';
      ctx.fillStyle = primary;
      ctx.fillText('SYS_', 70, 100);
      ctx.fillStyle = dim;
      ctx.fillText('AUD_', 70, 122);
      ctx.fillText('NET_', 70, 144);
    }

    // ===== TOP RIGHT STATUS BLOCK =====
    ctx.font = 'bold 28px Arial Black';
    ctx.fillStyle = primary;
    ctx.fillText('V', w - 180, 110);

    ctx.font = '500 12px Consolas, Monaco, monospace';
    ctx.fillStyle = dim;
    const statusLines = ['SYS.OK', 'MEM.64K', 'VID.VGA', 'FRQ.60'];
    statusLines.forEach((line, i) => {
      ctx.fillText(`█▀▀ ${line}`, w - 145, 90 + i * 18);
    });

    // ===== MAIN TEXT =====
    ctx.font = 'bold 140px Impact, Arial Black, sans-serif';
    ctx.textBaseline = 'middle';

    // Measure and center
    const textWidth = ctx.measureText(text).width;
    const textX = (w - textWidth) / 2;
    const textY = h / 2;

    // Outer stroke
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.strokeText(text, textX, textY);

    // Fill
    ctx.fillStyle = primary;
    ctx.fillText(text, textX, textY);

    ctx.textBaseline = 'alphabetic';

    // ===== TRANSCRIPT AREA =====
    if (transcript) {
      ctx.font = '500 14px Consolas, Monaco, monospace';
      ctx.fillStyle = dim;

      // Truncate if too long
      const maxWidth = w - 140;
      let displayText = transcript;
      while (ctx.measureText('> ' + displayText).width > maxWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
      }
      if (displayText !== transcript) displayText += '...';

      ctx.fillText('> ' + displayText, 70, h - 160);
    }

    // ===== VISUALIZER BARS =====
    if (showVisualizerBars && visualizerData.length > 0) {
      const barWidth = 20;
      const barGap = 8;
      const maxBars = Math.min(16, visualizerData.length);
      const totalWidth = maxBars * barWidth + (maxBars - 1) * barGap;
      const startX = (w - totalWidth) / 2;
      const baseY = h - 100;
      const maxHeight = 60;

      for (let i = 0; i < maxBars; i++) {
        const value = visualizerData[i] || 0;
        const barHeight = Math.max(4, value * maxHeight);
        const x = startX + i * (barWidth + barGap);

        ctx.fillStyle = isThinking ? '#4488ff' : primary;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);

        // Glow effect
        ctx.shadowColor = isThinking ? '#3377ff' : phosphor.glow;
        ctx.shadowBlur = isThinking ? 14 : 8;
        ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }
    }

    // ===== BOTTOM FOOTER =====
    ctx.font = '500 14px Consolas, Monaco, monospace';
    ctx.fillStyle = dim;
    ctx.fillText('VOICE.SYS', 70, h - 60);

    // Blinking cursor
    if (Math.floor(time / 30) % 2 === 0) {
      ctx.fillStyle = primary;
      ctx.fillRect(160, h - 75, 10, 18);
    }

    // Right-aligned text
    ctx.textAlign = 'right';
    ctx.fillText('PHOSPHOR DISPLAY v3.0', w - 70, h - 60);
    ctx.textAlign = 'left';
  }, [text, isListening, isSpeaking, isThinking, transcript, showStatusBar, showVisualizerBars, visualizerData, phosphor, dimColor, darkColor]);

  return (
    <CRTMonitorPro
      phosphorColor={phosphorColor}
      width={width}
      height={height}
      renderContent={renderContent}
      {...props}
    />
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default CRTMonitorPro;
