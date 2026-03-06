/**
 * Scene Registry
 *
 * Maps scene type strings to React components.
 * Adding a new scene: add type + data interface + renderer + register here.
 */

import React, { type ComponentType } from 'react';
import type { SceneType, SceneRendererProps } from '../types';

import { KineticTitleScene } from './KineticTitleScene';
import { BigNumberScene } from './BigNumberScene';
import { SplitScene } from './SplitScene';
import { HorizontalBarsScene } from './HorizontalBarsScene';
import { DonutChartScene } from './DonutChartScene';
import { EditorialCalloutScene } from './EditorialCalloutScene';
import { TickerFactsScene } from './TickerFactsScene';
import { CardStackScene } from './CardStackScene';
import { ChartScene } from './ChartScene';
import { ProfileScene } from './ProfileScene';
import { GroupScene } from './GroupScene';
import { InfographicMapScene } from './InfographicMapScene';
import { SvgVisualScene } from './SvgVisualScene';
import { QuoteScene } from './QuoteScene';
import { ImageFrameScene } from './ImageFrameScene';
import { ResearchHighlightScene } from './ResearchHighlightScene';
import { KineticTextScene } from './KineticTextScene';

// Cinematic scenes — inline (no R3F)
import { CinematicDitherScene } from './CinematicDitherScene';
import { CinematicFlatScene } from './CinematicFlatScene';
import { CinematicLayeredScene } from './CinematicLayeredScene';

// Cinematic scenes — lazy (R3F dependency, keeps bundle small)
const CinematicPointCloudScene = React.lazy(() =>
  import('./CinematicPointCloudScene').then((m) => ({ default: m.CinematicPointCloudScene }))
);
const CinematicDepthMeshScene = React.lazy(() =>
  import('./CinematicDepthMeshScene').then((m) => ({ default: m.CinematicDepthMeshScene }))
);
const CinematicCompositionScene = React.lazy(() =>
  import('./CinematicCompositionScene').then((m) => ({ default: m.CinematicCompositionScene }))
);

export const SCENE_REGISTRY: Record<SceneType, ComponentType<SceneRendererProps>> = {
  kinetic_title: KineticTitleScene,
  big_number: BigNumberScene,
  split: SplitScene,
  h_bars: HorizontalBarsScene,
  donut: DonutChartScene,
  editorial_callout: EditorialCalloutScene,
  ticker_facts: TickerFactsScene,
  card_stack: CardStackScene,
  chart: ChartScene,
  profile: ProfileScene,
  group: GroupScene,
  infographic_map: InfographicMapScene,
  svg_visual: SvgVisualScene,
  quote: QuoteScene,
  image_frame: ImageFrameScene,
  research_highlight: ResearchHighlightScene,
  kinetic_text: KineticTextScene,
  // Cinematic scenes
  cinematic_point_cloud: CinematicPointCloudScene as unknown as ComponentType<SceneRendererProps>,
  cinematic_depth_mesh: CinematicDepthMeshScene as unknown as ComponentType<SceneRendererProps>,
  cinematic_layered: CinematicLayeredScene,
  cinematic_composition: CinematicCompositionScene as unknown as ComponentType<SceneRendererProps>,
  cinematic_dither: CinematicDitherScene,
  cinematic_flat: CinematicFlatScene,
};

export function getSceneComponent(type: SceneType): ComponentType<SceneRendererProps> | null {
  return SCENE_REGISTRY[type] || null;
}
