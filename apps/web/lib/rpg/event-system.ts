import type {
  RPGEvent,
  RPGEventType,
  EventNotification,
  MetricChange,
  RelationshipChange,
  NotificationColor,
} from '@/types/rpg';
import { createRPGEvent, getSessionEvents } from '@/lib/db/rpg-queries';

/**
 * RPGEventSystem
 *
 * Creates, manages, and broadcasts RPG events and notifications.
 *
 * Responsibilities:
 * - Generate events for all significant RPG actions
 * - Format notifications for UI display
 * - Provide event streaming for real-time updates
 * - Track event history for replay/analysis
 */
export class RPGEventSystem {
  /**
   * Create a new RPG event
   */
  async createEvent(params: {
    session_id: string;
    type: RPGEventType;
    title: string;
    description: string;
    participants: string[]; // Agent IDs involved
    metrics_changed?: MetricChange[];
  }): Promise<RPGEvent> {
    const { session_id, type, title, description, participants, metrics_changed = [] } = params;

    // Generate notification UI data
    const notification = this.generateNotificationData(type, metrics_changed, participants);

    // Generate log entry
    const log_entry = this.generateLogEntry(type, title, metrics_changed);

    // Create event in database
    const event = await createRPGEvent({
      session_id,
      type,
      title,
      description,
      notification,
      log_entry,
    });

    return event as RPGEvent;
  }

  /**
   * Create event for relationship change
   */
  async createRelationshipChangeEvent(
    session_id: string,
    agent_a_id: string,
    agent_a_name: string,
    agent_b_id: string,
    agent_b_name: string,
    changes: RelationshipChange[]
  ): Promise<RPGEvent> {
    const primaryChange = changes[0];
    const metricName = this.formatMetricName(primaryChange.metric);

    const title = primaryChange.change > 0
      ? `${agent_b_name} appreciated that`
      : `${agent_b_name} didn't like that`;

    const description = `${agent_a_name}'s relationship with ${agent_b_name} changed: ${primaryChange.reason}`;

    return this.createEvent({
      session_id,
      type: primaryChange.change > 0 ? 'friendship_increase' : 'trust_penalty',
      title,
      description,
      participants: [agent_a_id, agent_b_id],
      metrics_changed: changes.map(c => ({
        agent_id: c.agent_id,
        metric: this.formatMetricName(c.metric),
        change: c.change,
      })),
    });
  }

  /**
   * Create event for secret revealed
   */
  async createSecretRevealedEvent(
    session_id: string,
    secret_content: string,
    revealed_by_id: string,
    revealed_by_name: string,
    revealed_to_id: string,
    revealed_to_name: string,
    context: string
  ): Promise<RPGEvent> {
    return this.createEvent({
      session_id,
      type: 'secret_revealed',
      title: `${revealed_by_name} revealed a secret`,
      description: `${revealed_by_name} shared with ${revealed_to_name}: "${secret_content.substring(0, 100)}..."`,
      participants: [revealed_by_id, revealed_to_id],
    });
  }

  /**
   * Create event for gossip spreading
   */
  async createGossipSpreadEvent(
    session_id: string,
    secret_content: string,
    from_agent_id: string,
    from_agent_name: string,
    to_agent_id: string,
    to_agent_name: string
  ): Promise<RPGEvent> {
    return this.createEvent({
      session_id,
      type: 'gossip_spread',
      title: 'Gossip is spreading',
      description: `${from_agent_name} gossiped to ${to_agent_name} about: "${secret_content.substring(0, 80)}..."`,
      participants: [from_agent_id, to_agent_id],
    });
  }

  /**
   * Create event for conflict emergence
   */
  async createConflictEvent(
    session_id: string,
    agent_a_id: string,
    agent_a_name: string,
    agent_b_id: string,
    agent_b_name: string,
    reason: string,
    severity: number
  ): Promise<RPGEvent> {
    const severityLabel = severity > 70 ? 'Major' : severity > 40 ? 'Moderate' : 'Minor';

    return this.createEvent({
      session_id,
      type: 'conflict',
      title: `${severityLabel} conflict emerged`,
      description: `${agent_a_name} and ${agent_b_name} are in conflict: ${reason}`,
      participants: [agent_a_id, agent_b_id],
    });
  }

  /**
   * Create event for alliance formation
   */
  async createAllianceEvent(
    session_id: string,
    agent_a_id: string,
    agent_a_name: string,
    agent_b_id: string,
    agent_b_name: string
  ): Promise<RPGEvent> {
    return this.createEvent({
      session_id,
      type: 'alliance_formed',
      title: 'New alliance formed',
      description: `${agent_a_name} and ${agent_b_name} have become close allies`,
      participants: [agent_a_id, agent_b_id],
    });
  }

  /**
   * Create event for task completion with impact
   */
  async createTaskCompletionEvent(
    session_id: string,
    task_title: string,
    completed_by_id: string,
    completed_by_name: string,
    impact_description: string
  ): Promise<RPGEvent> {
    return this.createEvent({
      session_id,
      type: 'task_completed',
      title: `${completed_by_name} completed a task`,
      description: `Task: "${task_title}". Impact: ${impact_description}`,
      participants: [completed_by_id],
    });
  }

  /**
   * Create event for user action
   */
  async createUserActionEvent(
    session_id: string,
    action: string,
    description: string,
    affected_agents: string[]
  ): Promise<RPGEvent> {
    return this.createEvent({
      session_id,
      type: 'user_action',
      title: `You ${action}`,
      description,
      participants: affected_agents,
    });
  }

  /**
   * Create event for romance spark
   */
  async createRomanceSparkEvent(
    session_id: string,
    agent_a_id: string,
    agent_a_name: string,
    agent_b_id: string,
    agent_b_name: string
  ): Promise<RPGEvent> {
    return this.createEvent({
      session_id,
      type: 'romance_spark',
      title: 'Romance is in the air',
      description: `There's a spark between ${agent_a_name} and ${agent_b_name}`,
      participants: [agent_a_id, agent_b_id],
    });
  }

  /**
   * Generate notification data for UI
   */
  generateNotificationData(
    type: RPGEventType,
    metrics_changed: MetricChange[],
    participants: string[]
  ): EventNotification {
    // Map event types to icons and colors
    const config: Record<RPGEventType, { icon: string; color: NotificationColor }> = {
      relationship_change: { icon: 'users', color: 'blue' },
      secret_revealed: { icon: 'lock-key-open', color: 'yellow' },
      conflict: { icon: 'warning', color: 'red' },
      alliance_formed: { icon: 'handshake', color: 'green' },
      task_completed: { icon: 'check-circle', color: 'green' },
      user_action: { icon: 'user-circle', color: 'blue' },
      agent_action: { icon: 'robot', color: 'blue' },
      gossip_spread: { icon: 'chat-dots', color: 'yellow' },
      trust_penalty: { icon: 'arrow-down', color: 'red' },
      friendship_increase: { icon: 'arrow-up', color: 'green' },
      rivalry_start: { icon: 'swords', color: 'orange' },
      romance_spark: { icon: 'heart', color: 'red' },
    };

    const { icon, color } = config[type] || { icon: 'info', color: 'blue' };

    return {
      icon,
      color,
      participants,
      metrics_changed,
    };
  }

  /**
   * Generate a formatted log entry
   */
  private generateLogEntry(
    type: RPGEventType,
    title: string,
    metrics_changed: MetricChange[]
  ): string {
    const parts = [title];

    // Add metric changes to log
    for (const change of metrics_changed) {
      const sign = change.change > 0 ? '+' : '';
      parts.push(`${sign}${change.change} ${change.metric}`);
    }

    return parts.join(' | ');
  }

  /**
   * Format metric name for display
   */
  private formatMetricName(metric: string): string {
    return metric.charAt(0).toUpperCase() + metric.slice(1);
  }

  /**
   * Generate user-friendly notification message
   */
  generateNotificationMessage(event: RPGEvent): string {
    const { type, title, notification } = event;

    const metrics = notification.metrics_changed || [];
    if (metrics.length === 0) {
      return title;
    }

    // Format: "Tony didn't like that -10 trust"
    const primaryMetric = metrics[0];
    const sign = primaryMetric.change > 0 ? '+' : '';
    return `${title} ${sign}${primaryMetric.change} ${primaryMetric.metric.toLowerCase()}`;
  }

  /**
   * Get recent events for a session
   */
  async getRecentEvents(session_id: string, limit: number = 50): Promise<RPGEvent[]> {
    return getSessionEvents(session_id, limit);
  }

  /**
   * Get events filtered by type
   */
  async getEventsByType(
    session_id: string,
    type: RPGEventType,
    limit: number = 20
  ): Promise<RPGEvent[]> {
    const allEvents = await getSessionEvents(session_id, 100);
    return allEvents
      .filter(e => e.type === type)
      .slice(0, limit);
  }

  /**
   * Get events involving specific agent
   */
  async getAgentEvents(
    session_id: string,
    agent_id: string,
    limit: number = 30
  ): Promise<RPGEvent[]> {
    const allEvents = await getSessionEvents(session_id, 100);
    return allEvents
      .filter(e => {
        const participants = e.notification.participants || [];
        return participants.includes(agent_id);
      })
      .slice(0, limit);
  }

  /**
   * Calculate event statistics for session
   */
  async getEventStatistics(session_id: string): Promise<{
    total: number;
    by_type: Record<string, number>;
    positive_count: number;
    negative_count: number;
    recent_trend: 'improving' | 'declining' | 'stable';
  }> {
    const events = await getSessionEvents(session_id, 100);

    const by_type: Record<string, number> = {};
    let positive_count = 0;
    let negative_count = 0;

    for (const event of events) {
      by_type[event.type] = (by_type[event.type] || 0) + 1;

      // Count positive vs negative events
      if (this.isPositiveEvent(event.type)) {
        positive_count++;
      } else if (this.isNegativeEvent(event.type)) {
        negative_count++;
      }
    }

    // Analyze recent trend (last 10 events)
    const recentEvents = events.slice(0, 10);
    const recentPositive = recentEvents.filter(e => this.isPositiveEvent(e.type)).length;
    const recentNegative = recentEvents.filter(e => this.isNegativeEvent(e.type)).length;

    let recent_trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentPositive > recentNegative * 1.5) {
      recent_trend = 'improving';
    } else if (recentNegative > recentPositive * 1.5) {
      recent_trend = 'declining';
    }

    return {
      total: events.length,
      by_type,
      positive_count,
      negative_count,
      recent_trend,
    };
  }

  /**
   * Helper: Check if event type is positive
   */
  private isPositiveEvent(type: RPGEventType): boolean {
    return [
      'alliance_formed',
      'task_completed',
      'friendship_increase',
      'romance_spark',
    ].includes(type);
  }

  /**
   * Helper: Check if event type is negative
   */
  private isNegativeEvent(type: RPGEventType): boolean {
    return [
      'conflict',
      'trust_penalty',
      'rivalry_start',
      'secret_revealed', // Can be negative depending on context
      'gossip_spread',
    ].includes(type);
  }

  /**
   * Create event stream for real-time updates
   * (To be used with Server-Sent Events or WebSocket)
   */
  async *streamEvents(session_id: string): AsyncGenerator<RPGEvent> {
    // This will be integrated with actual SSE/WebSocket in the API layer
    // For now, return recent events as a starting point
    const events = await getSessionEvents(session_id, 10);
    for (const event of events) {
      yield event;
    }
  }
}

// Export singleton instance
export const rpgEventSystem = new RPGEventSystem();
