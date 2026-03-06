/**
 * Action Controller
 *
 * Manages action lifecycle: entrance transitions, active state, exit transitions.
 * Called once per frame from the BinaryAssistant animate loop.
 *
 * Flow:
 *   setActivity('reading')
 *     → if current action active, begin 'exiting' phase
 *     → queue 'reading' as pendingActivity
 *     → when exit completes, start 'entering' phase for reading
 *     → when enter completes, move to 'active' phase
 *   setActivity('idle')
 *     → begin 'exiting' phase for current action
 *     → when exit completes, phase = 'idle'
 */

import type {
  AssistantActivity,
  ActionPhase,
  ActionDefinition,
  ActionVariation,
  PoseModifier,
  ActionProp,
  ActionControllerState,
} from './types';
import { getAction } from './registry';
import { generateVariation } from './variation';

const EMPTY_POSE: PoseModifier = {};
const EMPTY_VARIATION: ActionVariation = {
  rotation: 0,
  scaleMultiplier: 1,
  speed: 1,
  styleIndex: 0,
  seed: 0,
};

export class ActionController {
  private currentActivity: AssistantActivity = 'idle';
  private phase: ActionPhase = 'idle';
  private phaseStartTime: number = 0;
  private variation: ActionVariation = EMPTY_VARIATION;
  private pendingActivity: AssistantActivity | null = null;
  private currentDefinition: ActionDefinition | null = null;

  /** Set the desired activity. Handles transition logic. */
  setActivity(activity: AssistantActivity): void {
    // Same activity — no-op
    if (activity === this.currentActivity && this.phase !== 'exiting') return;

    if (this.phase === 'active' || this.phase === 'entering') {
      // Currently showing an action — begin exit, queue the new one
      this.pendingActivity = activity;
      this.phase = 'exiting';
      this.phaseStartTime = Date.now();
    } else if (this.phase === 'exiting') {
      // Already exiting — just update the pending target
      this.pendingActivity = activity;
    } else {
      // Idle — start immediately
      this.startAction(activity);
    }
  }

  /** Called every frame. Returns current pose + prop info for rendering. */
  update(now: number): { pose: PoseModifier; props: ActionProp[]; variation: ActionVariation; propProgress: number } {
    if (this.phase === 'idle' || !this.currentDefinition) {
      return { pose: EMPTY_POSE, props: [], variation: EMPTY_VARIATION, propProgress: 0 };
    }

    const elapsed = now - this.phaseStartTime;
    const def = this.currentDefinition;

    // Calculate the longest entrance/exit duration across all props
    const maxEnterDuration = Math.max(...def.props.map(p => p.enterDuration), 200);
    const maxExitDuration = Math.max(...def.props.map(p => p.exitDuration), 150);

    if (this.phase === 'entering') {
      const progress = Math.min(1, elapsed / maxEnterDuration);
      if (progress >= 1) {
        this.phase = 'active';
        this.phaseStartTime = now;
      }
      return {
        pose: this.interpolatePose(def.pose, progress),
        props: def.props,
        variation: this.variation,
        propProgress: easeOutCubic(progress),
      };
    }

    if (this.phase === 'active') {
      return {
        pose: def.pose,
        props: def.props,
        variation: this.variation,
        propProgress: 1,
      };
    }

    if (this.phase === 'exiting') {
      const progress = Math.min(1, elapsed / maxExitDuration);
      if (progress >= 1) {
        // Exit complete — start pending or go idle
        if (this.pendingActivity && this.pendingActivity !== 'idle') {
          this.startAction(this.pendingActivity);
          this.pendingActivity = null;
          // Return the new entering state
          return this.update(now);
        } else {
          this.phase = 'idle';
          this.currentActivity = 'idle';
          this.currentDefinition = null;
          this.pendingActivity = null;
          return { pose: EMPTY_POSE, props: [], variation: EMPTY_VARIATION, propProgress: 0 };
        }
      }
      return {
        pose: this.interpolatePose(def.pose, 1 - progress),
        props: def.props,
        variation: this.variation,
        propProgress: 1 - easeInCubic(progress),
      };
    }

    return { pose: EMPTY_POSE, props: [], variation: EMPTY_VARIATION, propProgress: 0 };
  }

  /** Get current controller state for debugging */
  getState(): ActionControllerState {
    return {
      currentActivity: this.currentActivity,
      phase: this.phase,
      phaseStartTime: this.phaseStartTime,
      variation: this.variation,
      pendingActivity: this.pendingActivity,
      phaseProgress: 0,
    };
  }

  private startAction(activity: AssistantActivity): void {
    if (activity === 'idle') {
      this.phase = 'idle';
      this.currentActivity = 'idle';
      this.currentDefinition = null;
      return;
    }

    const def = getAction(activity);
    if (!def) {
      // No definition registered for this activity — stay idle
      this.phase = 'idle';
      this.currentActivity = 'idle';
      this.currentDefinition = null;
      return;
    }

    this.currentActivity = activity;
    this.currentDefinition = def;
    this.variation = generateVariation(def.styleVariants);
    this.phase = 'entering';
    this.phaseStartTime = Date.now();
  }

  /** Blend pose modifier by a 0-1 factor */
  private interpolatePose(pose: PoseModifier, t: number): PoseModifier {
    return {
      leftEye: t > 0.5 ? pose.leftEye : undefined,
      rightEye: t > 0.5 ? pose.rightEye : undefined,
      eyeSpeed: pose.eyeSpeed ? 1 + (pose.eyeSpeed - 1) * t : undefined,
      squint: pose.squint ? pose.squint * t : undefined,
      mouth: t > 0.6 ? pose.mouth : undefined,
      headTilt: pose.headTilt ? pose.headTilt * t : undefined,
      gazeX: pose.gazeX ? pose.gazeX * t : undefined,
      gazeY: pose.gazeY ? pose.gazeY * t : undefined,
    };
  }
}

// Easing functions
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}
