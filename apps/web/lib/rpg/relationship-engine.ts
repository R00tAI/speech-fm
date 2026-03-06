import type {
  AgentRelationship,
  RelationshipMetrics,
  RelationshipStatus,
  InteractionParams,
  InteractionType,
  RelationshipChange,
  WillShareParams,
  WillShareResult,
  TrustPenaltyParams,
  RPGEvent,
  AgentSecret,
  MoodTowards,
} from '@/types/rpg';
import type { AgentPersonality, OCEANTraits, MBTIType } from '@/types/agency';
import {
  getRelationship,
  updateRelationship,
  getAllRelationshipsForAgent,
  createRelationship,
} from '@/lib/db/rpg-queries';

/**
 * RelationshipEngine
 *
 * The heart of the RPG system - manages all agent relationship dynamics,
 * trust calculations, gossip propagation, and conflict emergence.
 *
 * Key Features:
 * - Personality-driven interactions (MBTI + OCEAN)
 * - Dynamic trust/respect/friendship calculations
 * - Gossip likelihood based on agreeableness
 * - Conflict detection and rivalry mechanics
 * - Natural relationship progression
 */
export class RelationshipEngine {
  /**
   * Process an interaction between two agents and calculate relationship changes
   */
  async processInteraction(params: InteractionParams): Promise<RelationshipChange[]> {
    const {
      session_id,
      agent_a_id,
      agent_b_id,
      interaction_type,
      context,
      message_content,
    } = params;

    // Get or create relationship
    let relationship = await getRelationship(session_id, agent_a_id, agent_b_id);
    if (!relationship) {
      relationship = await createRelationship({
        session_id,
        agent_a_id,
        agent_b_id,
      }) as AgentRelationship;
    }

    // Calculate changes based on interaction type
    const changes = this.calculateInteractionImpact(
      interaction_type,
      relationship,
      context,
      message_content
    );

    // Apply changes to relationship
    const updatedMetrics = this.applyChanges(relationship, changes);

    // Determine new status based on metrics
    const newStatus = this.calculateRelationshipStatus(updatedMetrics);

    // Determine mood
    const newMood = this.calculateMood(updatedMetrics);

    // Update relationship in database
    await updateRelationship(relationship.relationship_id, {
      ...updatedMetrics,
      status: newStatus,
      current_mood_towards: newMood,
      interaction_count: relationship.interaction_count + 1,
      positive_interactions: relationship.positive_interactions + (this.isPositive(interaction_type) ? 1 : 0),
      negative_interactions: relationship.negative_interactions + (this.isNegative(interaction_type) ? 1 : 0),
      last_interaction: new Date().toISOString(),
    });

    return changes;
  }

  /**
   * Calculate the impact of an interaction on relationship metrics
   */
  private calculateInteractionImpact(
    type: InteractionType,
    relationship: AgentRelationship,
    context: string,
    message?: string
  ): RelationshipChange[] {
    const changes: RelationshipChange[] = [];

    // Base changes per interaction type
    const impacts: Record<InteractionType, Partial<RelationshipMetrics>> = {
      positive_feedback: { trust: 5, respect: 3, friendship: 4 },
      negative_feedback: { trust: -8, respect: -5, friendship: -3, rivalry: 3 },
      collaboration: { trust: 3, friendship: 5, respect: 2 },
      conflict: { trust: -10, friendship: -8, rivalry: 8, respect: -4 },
      gossip: { trust: -15, friendship: -10, rivalry: 5 }, // Being gossiped about
      support: { trust: 7, friendship: 8, respect: 4 },
      criticism: { trust: -5, respect: -3, rivalry: 4 },
      praise: { trust: 4, friendship: 6, respect: 5 },
      secret_shared: { trust: 10, friendship: 12 }, // Significant trust boost
      secret_betrayed: { trust: -25, friendship: -20, rivalry: 15, respect: -10 }, // Devastating
    };

    const baseImpact = impacts[type] || {};

    // Convert to changes array
    for (const [metric, change] of Object.entries(baseImpact)) {
      if (change !== 0) {
        changes.push({
          agent_id: relationship.agent_b_id,
          metric: metric as keyof RelationshipMetrics,
          change: change as number,
          reason: `${type}: ${context}`,
        });
      }
    }

    return changes;
  }

  /**
   * Apply changes to relationship metrics (clamped 0-100)
   */
  private applyChanges(
    relationship: AgentRelationship,
    changes: RelationshipChange[]
  ): AgentRelationship {
    const updated = { ...relationship };

    for (const change of changes) {
      const currentValue = updated[change.metric] as number;
      const newValue = Math.max(0, Math.min(100, currentValue + change.change));
      (updated[change.metric] as number) = newValue;
    }

    return updated;
  }

  /**
   * Determine relationship status based on current metrics
   */
  calculateRelationshipStatus(metrics: RelationshipMetrics | AgentRelationship): RelationshipStatus {
    const { trust, friendship, rivalry, attraction } = metrics;

    // Romance path
    if (attraction > 70 && trust > 60 && friendship > 60) {
      return 'dating';
    }
    if (attraction > 50 && trust > 50) {
      return 'romantic_interest';
    }

    // Negative relationships
    if (rivalry > 70 || trust < 20) {
      return 'enemies';
    }
    if (rivalry > 40 || trust < 35) {
      return 'rivals';
    }

    // Positive relationships
    if (friendship > 85 && trust > 80) {
      return 'best_friends';
    }
    if (friendship > 70 && trust > 65) {
      return 'close_friends';
    }
    if (friendship > 50 && trust > 45) {
      return 'friends';
    }

    // Neutral/new relationships
    if (trust > 40 && friendship > 30) {
      return 'acquaintances';
    }

    return 'strangers';
  }

  /**
   * Calculate mood towards another agent based on metrics
   */
  private calculateMood(metrics: RelationshipMetrics | AgentRelationship): MoodTowards {
    const { trust, friendship, rivalry } = metrics;

    // Conflicted if high attraction but low trust, or mixed signals
    if (
      (metrics.attraction > 50 && trust < 40) ||
      (friendship > 50 && rivalry > 40)
    ) {
      return 'conflicted';
    }

    // Positive if generally good metrics
    if (trust > 60 && friendship > 55 && rivalry < 30) {
      return 'positive';
    }

    // Negative if bad metrics
    if (trust < 35 || rivalry > 50 || friendship < 25) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Determine if an agent will share a secret based on relationship and personality
   */
  async willShareSecret(params: WillShareParams): Promise<WillShareResult> {
    const {
      agent_id,
      secret_id,
      with_agent_id,
      current_relationship,
      context,
    } = params;

    // Base willingness based on trust
    const trustThreshold = context === 'private_call' ? 60 : context === 'group_chat' ? 75 : 70;

    if (current_relationship.trust < trustThreshold) {
      return {
        will_share: false,
        reason: `Trust level (${current_relationship.trust}) below threshold (${trustThreshold}) for ${context}`,
      };
    }

    // Friendship bonus
    const friendshipBonus = current_relationship.friendship > 70 ? 10 : 0;

    // Calculate total "willingness score"
    const willingnessScore = current_relationship.trust + friendshipBonus;

    // Context penalties
    const contextPenalty = context === 'gossip' ? 20 : 0; // Harder to gossip

    const finalScore = willingnessScore - contextPenalty;

    return {
      will_share: finalScore >= trustThreshold,
      reason: finalScore >= trustThreshold
        ? `Willingness score (${finalScore}) sufficient to share in ${context}`
        : `Willingness score (${finalScore}) insufficient for ${context}`,
      conditions: [
        `Trust: ${current_relationship.trust}/100`,
        `Friendship: ${current_relationship.friendship}/100`,
        `Context: ${context}`,
      ],
    };
  }

  /**
   * Determine if an agent will gossip about a secret based on personality
   */
  willGossip(
    agentPersonality: AgentPersonality,
    secret: AgentSecret,
    relationshipWithSubject: AgentRelationship,
    relationshipWithRecipient: AgentRelationship
  ): { will_gossip: boolean; reason: string } {
    const { ocean } = agentPersonality;

    // Low agreeableness = more likely to gossip
    const agreeablenessThreshold = 0.6;
    const willingnessFromPersonality = (1 - ocean.agreeableness) * 100;

    // High rivalry with subject increases gossip likelihood
    const rivalryBonus = relationshipWithSubject.rivalry > 50 ? 20 : 0;

    // High friendship with recipient increases gossip likelihood (sharing drama)
    const friendshipBonus = relationshipWithRecipient.friendship > 60 ? 10 : 0;

    // Severity of secret matters
    const severityMultiplier = {
      minor: 0.5,
      moderate: 0.8,
      major: 1.0,
      explosive: 1.2,
    }[secret.severity];

    const gossipScore = (willingnessFromPersonality + rivalryBonus + friendshipBonus) * severityMultiplier;

    // Threshold for gossiping
    const gossipThreshold = 50;

    return {
      will_gossip: gossipScore >= gossipThreshold,
      reason: gossipScore >= gossipThreshold
        ? `Gossip score (${gossipScore.toFixed(1)}) exceeds threshold due to low agreeableness (${ocean.agreeableness.toFixed(2)})`
        : `Gossip score (${gossipScore.toFixed(1)}) below threshold (${gossipThreshold})`,
    };
  }

  /**
   * Apply trust penalty to an agent affecting multiple relationships
   */
  async applyTrustPenalty(params: TrustPenaltyParams): Promise<RelationshipChange[]> {
    const { session_id, agent_id, reason, severity, affected_agents } = params;

    const changes: RelationshipChange[] = [];

    for (const affected_agent_id of affected_agents) {
      const relationship = await getRelationship(session_id, agent_id, affected_agent_id);
      if (!relationship) continue;

      // Calculate penalty based on severity
      const trustPenalty = -Math.min(severity, 30); // Cap at -30
      const friendshipPenalty = -Math.min(severity * 0.6, 20);
      const rivalryIncrease = Math.min(severity * 0.4, 15);

      const relationshipChanges: RelationshipChange[] = [
        { agent_id: affected_agent_id, metric: 'trust', change: trustPenalty, reason },
        { agent_id: affected_agent_id, metric: 'friendship', change: friendshipPenalty, reason },
        { agent_id: affected_agent_id, metric: 'rivalry', change: rivalryIncrease, reason },
      ];

      // Apply changes
      const updated = this.applyChanges(relationship, relationshipChanges);
      const newStatus = this.calculateRelationshipStatus(updated);
      const newMood = this.calculateMood(updated);

      await updateRelationship(relationship.relationship_id, {
        trust: updated.trust,
        friendship: updated.friendship,
        rivalry: updated.rivalry,
        status: newStatus,
        current_mood_towards: newMood,
        negative_interactions: relationship.negative_interactions + 1,
        last_interaction: new Date().toISOString(),
      });

      changes.push(...relationshipChanges);
    }

    return changes;
  }

  /**
   * Calculate personality compatibility between two agents
   * Returns a score from 0-100 (100 = perfect compatibility)
   */
  calculatePersonalityCompatibility(
    personality_a: AgentPersonality,
    personality_b: AgentPersonality
  ): number {
    let compatibilityScore = 50; // Start at neutral

    // MBTI compatibility (simplified)
    const mbtiCompatibility = this.getMBTICompatibility(personality_a.mbti, personality_b.mbti);
    compatibilityScore += mbtiCompatibility * 20; // -20 to +20

    // OCEAN compatibility
    const oceanCompatibility = this.getOCEANCompatibility(personality_a.ocean, personality_b.ocean);
    compatibilityScore += oceanCompatibility * 30; // -30 to +30

    return Math.max(0, Math.min(100, compatibilityScore));
  }

  /**
   * Get MBTI compatibility score (-1 to 1)
   */
  private getMBTICompatibility(mbti_a: MBTIType, mbti_b: MBTIType): number {
    // Simplified compatibility based on cognitive functions
    // Same type: 0.8
    // Complementary: 1.0 (INTJ + ENFP, INFJ + ENTP, etc.)
    // Conflicting: -0.5 (all opposite letters)

    if (mbti_a === mbti_b) return 0.8;

    const a = mbti_a.split('');
    const b = mbti_b.split('');

    let differences = 0;
    for (let i = 0; i < 4; i++) {
      if (a[i] !== b[i]) differences++;
    }

    // Complementary pairs (2 differences in specific positions)
    if (differences === 2) {
      // E/I and J/P different, N/S and T/F same = complementary
      if (a[0] !== b[0] && a[3] !== b[3] && a[1] === b[1] && a[2] === b[2]) {
        return 1.0;
      }
    }

    // All different = conflicting
    if (differences === 4) return -0.5;

    // Moderate compatibility
    return 0.2 * (4 - differences) - 0.4;
  }

  /**
   * Get OCEAN trait compatibility (-1 to 1)
   */
  private getOCEANCompatibility(ocean_a: OCEANTraits, ocean_b: OCEANTraits): number {
    let compatibility = 0;

    // Extraversion: Similar is better (both high or both low)
    const extraversionDiff = Math.abs(ocean_a.extraversion - ocean_b.extraversion);
    compatibility += (1 - extraversionDiff) * 0.3; // Weight: 0.3

    // Agreeableness: Both high is good, one low one high can cause conflict
    const agreeablenessAvg = (ocean_a.agreeableness + ocean_b.agreeableness) / 2;
    compatibility += agreeablenessAvg * 0.4; // Weight: 0.4

    // Conscientiousness: Similar is better for collaboration
    const conscientiousnessDiff = Math.abs(ocean_a.conscientiousness - ocean_b.conscientiousness);
    compatibility += (1 - conscientiousnessDiff) * 0.15; // Weight: 0.15

    // Openness: Different can be interesting, same is comfortable
    const opennessDiff = Math.abs(ocean_a.openness - ocean_b.openness);
    compatibility += (1 - opennessDiff * 0.5) * 0.1; // Weight: 0.1, less penalty for difference

    // Neuroticism: Lower is better for stability
    const neuroticismAvg = (ocean_a.neuroticism + ocean_b.neuroticism) / 2;
    compatibility += (1 - neuroticismAvg) * 0.05; // Weight: 0.05

    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, compatibility * 2 - 1));
  }

  /**
   * Detect if a conflict should emerge based on recent interactions
   */
  async detectConflictEmergence(
    session_id: string,
    agent_a_id: string,
    agent_b_id: string
  ): Promise<{ conflict_emerged: boolean; reason?: string }> {
    const relationship = await getRelationship(session_id, agent_a_id, agent_b_id);
    if (!relationship) return { conflict_emerged: false };

    // Conflict emerges if:
    // 1. Trust drops below 30
    // 2. Rivalry exceeds 60
    // 3. Multiple negative interactions in short time

    if (relationship.trust < 30 && relationship.rivalry > 60) {
      return {
        conflict_emerged: true,
        reason: `Low trust (${relationship.trust}) and high rivalry (${relationship.rivalry})`,
      };
    }

    if (relationship.negative_interactions > relationship.positive_interactions * 2) {
      return {
        conflict_emerged: true,
        reason: `Negative interactions (${relationship.negative_interactions}) significantly outweigh positive (${relationship.positive_interactions})`,
      };
    }

    return { conflict_emerged: false };
  }

  /**
   * Get all relationships for an agent with enriched data
   */
  async getAgentRelationshipSummary(session_id: string, agent_id: string) {
    const relationships = await getAllRelationshipsForAgent(session_id, agent_id);

    return relationships.map(rel => {
      const status = this.calculateRelationshipStatus(rel);
      const mood = this.calculateMood(rel);

      return {
        ...rel,
        status,
        current_mood_towards: mood,
        summary: this.generateRelationshipSummary(rel),
      };
    });
  }

  /**
   * Generate a human-readable summary of a relationship
   */
  private generateRelationshipSummary(relationship: AgentRelationship): string {
    const { trust, friendship, rivalry, attraction, status } = relationship;

    const parts: string[] = [];

    // Status
    parts.push(`Status: ${status.replace('_', ' ')}`);

    // Key metrics
    if (trust > 70) parts.push('high trust');
    else if (trust < 30) parts.push('low trust');

    if (friendship > 70) parts.push('strong friendship');
    else if (friendship < 30) parts.push('weak bond');

    if (rivalry > 50) parts.push('rivalry present');
    if (attraction > 50) parts.push('mutual attraction');

    return parts.join(', ');
  }

  /**
   * Helper: Check if interaction is positive
   */
  private isPositive(type: InteractionType): boolean {
    return ['positive_feedback', 'collaboration', 'support', 'praise', 'secret_shared'].includes(type);
  }

  /**
   * Helper: Check if interaction is negative
   */
  private isNegative(type: InteractionType): boolean {
    return ['negative_feedback', 'conflict', 'gossip', 'criticism', 'secret_betrayed'].includes(type);
  }
}

// Export singleton instance
export const relationshipEngine = new RelationshipEngine();
