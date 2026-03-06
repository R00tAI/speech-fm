import { generateText } from 'ai';
import { gatewayAnthropic } from '@/lib/ai/vercel-gateway';
import type {
  AgentSecret,
  SecretType,
  SecretSeverity,
  GossipNode,
  SecretConsequences,
} from '@/types/rpg';
import type { AgentConfig, AgentPersonality } from '@/types/agency';
import {
  createSecret,
  getSecret,
  revealSecret,
  getAgentSecrets,
  getSecretsKnownByAgent,
} from '@/lib/db/rpg-queries';
import { relationshipEngine } from './relationship-engine';
import { rpgEventSystem } from './event-system';

/**
 * SecretManager
 *
 * Generates, manages, and propagates secrets throughout the agent network.
 *
 * Features:
 * - AI-generated secrets based on agent role/personality
 * - Gossip propagation algorithms
 * - Consequence system when secrets are revealed
 * - Trust-based secret sharing
 */
export class SecretManager {
  constructor() {}

  /**
   * Generate secrets for an agent using Claude
   */
  async generateSecretsForAgent(params: {
    session_id: string;
    agent: AgentConfig;
    scenario_context?: string;
    count?: number;
  }): Promise<AgentSecret[]> {
    const { session_id, agent, scenario_context = '', count = 2 } = params;

    const prompt = this.buildSecretGenerationPrompt(agent, scenario_context, count);

    try {
      const result = await generateText({
        model: gatewayAnthropic('claude-sonnet-4-5-20250929'),
        maxTokens: 2000,
        temperature: 0.9,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const secretsData = JSON.parse(result.text);
      const secrets: AgentSecret[] = [];

      for (const secretData of secretsData.secrets) {
        const secret = await createSecret({
          session_id,
          agent_id: agent.id,
          type: secretData.type,
          severity: secretData.severity,
          content: secretData.content,
          consequences_if_revealed: secretData.consequences,
        });

        secrets.push(secret as AgentSecret);
      }

      return secrets;
    } catch (error) {
      console.error('Error generating secrets:', error);
      // Fallback to default secrets if AI generation fails
      return this.generateDefaultSecrets(session_id, agent, count);
    }
  }

  /**
   * Build prompt for secret generation
   */
  private buildSecretGenerationPrompt(
    agent: AgentConfig,
    scenario_context: string,
    count: number
  ): string {
    const personalityStr = agent.personality
      ? `MBTI: ${agent.personality.mbti}, Traits: ${JSON.stringify(agent.personality.ocean)}`
      : 'No specific personality defined';

    const backstoryStr = agent.backstoryDetails?.summary || 'No backstory provided';

    return `You are creating ${count} secrets for an agent in an RPG game mode where users interact with AI agents who have complex personalities and relationships.

**Agent Details:**
- Name: ${agent.name}
- Role: ${agent.role}
- Personality: ${personalityStr}
- Backstory: ${backstoryStr}
- Communication Style: ${agent.communicationStyle}

**Scenario Context:**
${scenario_context || 'General workplace project scenario'}

**Instructions:**
Generate ${count} secrets that this agent might be hiding. Secrets should:
1. Be believable and fit the agent's role/personality
2. Range in severity (minor, moderate, major, explosive)
3. Have potential consequences if revealed
4. Create interesting interpersonal dynamics

**Secret Types:**
- personal: Private life, feelings, insecurities
- professional: Work mistakes, shortcuts, incompetence
- relationship: Attractions, conflicts, alliances
- project: Project-related issues, hidden problems
- past: Previous experiences, failures, achievements

**Output Format (JSON):**
{
  "secrets": [
    {
      "type": "personal | professional | relationship | project | past",
      "severity": "minor | moderate | major | explosive",
      "content": "The secret itself (1-2 sentences)",
      "consequences": {
        "trust_penalties": [
          {"agent_id": "agent_role_or_all", "penalty": 10-30}
        ],
        "relationship_changes": [
          {"agent_id": "agent_role", "change": "description"}
        ]
      }
    }
  ]
}

Make the secrets juicy, realistic, and conducive to drama. Avoid clichés.`;
  }

  /**
   * Fallback: Generate default secrets if AI fails
   */
  private async generateDefaultSecrets(
    session_id: string,
    agent: AgentConfig,
    count: number
  ): Promise<AgentSecret[]> {
    const defaultSecretTemplates: Array<{
      type: SecretType;
      severity: SecretSeverity;
      content: string;
    }> = [
      {
        type: 'professional',
        severity: 'moderate',
        content: `${agent.name} introduced a bug in the last update but hasn't told anyone yet.`,
      },
      {
        type: 'personal',
        severity: 'minor',
        content: `${agent.name} is feeling overwhelmed and considering taking time off.`,
      },
      {
        type: 'relationship',
        severity: 'moderate',
        content: `${agent.name} doesn't think the project manager is competent.`,
      },
    ];

    const secrets: AgentSecret[] = [];
    for (let i = 0; i < Math.min(count, defaultSecretTemplates.length); i++) {
      const template = defaultSecretTemplates[i];
      const secret = await createSecret({
        session_id,
        agent_id: agent.id,
        type: template.type,
        severity: template.severity,
        content: template.content,
        consequences_if_revealed: {
          trust_penalties: [{ agent_id: 'all', penalty: 10 }],
          relationship_changes: [],
        },
      });

      secrets.push(secret as AgentSecret);
    }

    return secrets;
  }

  /**
   * Propagate gossip - agent decides whether to share a secret they know
   */
  async propagateGossip(params: {
    session_id: string;
    secret_id: string;
    from_agent_id: string;
    from_agent_personality: AgentPersonality;
    to_agent_id: string;
    current_relationships: Map<string, any>; // agent_id -> AgentRelationship
  }): Promise<{ gossiped: boolean; reason: string }> {
    const { session_id, secret_id, from_agent_id, from_agent_personality, to_agent_id, current_relationships } = params;

    const secret = await getSecret(secret_id);
    if (!secret) {
      return { gossiped: false, reason: 'Secret not found' };
    }

    // Check if agent already knows this secret
    const knownSecrets = await getSecretsKnownByAgent(session_id, to_agent_id);
    if (knownSecrets.some(s => s.secret_id === secret_id)) {
      return { gossiped: false, reason: 'Agent already knows this secret' };
    }

    // Get relationships
    const relationshipWithSubject = current_relationships.get(secret.agent_id);
    const relationshipWithRecipient = current_relationships.get(to_agent_id);

    if (!relationshipWithSubject || !relationshipWithRecipient) {
      return { gossiped: false, reason: 'Missing relationship data' };
    }

    // Decide if agent will gossip based on personality
    const { will_gossip, reason } = relationshipEngine.willGossip(
      from_agent_personality,
      secret,
      relationshipWithSubject,
      relationshipWithRecipient
    );

    if (will_gossip) {
      // Reveal secret to recipient
      await revealSecret(secret_id, to_agent_id, from_agent_id, 'gossip');

      // Create gossip event
      await rpgEventSystem.createGossipSpreadEvent(
        session_id,
        secret.content,
        from_agent_id,
        `Agent ${from_agent_id}`, // Would need agent names passed in
        to_agent_id,
        `Agent ${to_agent_id}`
      );
    }

    return { gossiped: will_gossip, reason };
  }

  /**
   * Apply consequences when a secret is publicly revealed
   */
  async applySecretConsequences(params: {
    session_id: string;
    secret_id: string;
    revealed_by: string;
    revealed_to: string[];
  }): Promise<void> {
    const { session_id, secret_id, revealed_by, revealed_to } = params;

    const secret = await getSecret(secret_id);
    if (!secret || !secret.consequences_if_revealed) return;

    const consequences = secret.consequences_if_revealed;

    // Apply trust penalties
    for (const penalty of consequences.trust_penalties) {
      const affected_agents = penalty.agent_id === 'all' ? revealed_to : [penalty.agent_id];

      await relationshipEngine.applyTrustPenalty({
        session_id,
        agent_id: secret.agent_id,
        reason: `Secret revealed: ${secret.content.substring(0, 50)}...`,
        severity: penalty.penalty,
        affected_agents,
      });
    }

    // Log relationship changes (these would be processed by relationship engine)
    // This is more descriptive than prescriptive
  }

  /**
   * Simulate gossip spreading through agent network over time
   */
  async simulateGossipWave(params: {
    session_id: string;
    secret_id: string;
    starting_agent_id: string;
    agent_personalities: Map<string, AgentPersonality>; // agent_id -> personality
    agent_relationships: Map<string, Map<string, any>>; // agent_id -> Map<other_agent_id, relationship>
    max_spread: number;
  }): Promise<{
    spread_to: string[];
    gossip_chain: GossipNode[];
  }> {
    const { session_id, secret_id, starting_agent_id, agent_personalities, agent_relationships, max_spread = 10 } = params;

    const spread_to: Set<string> = new Set([starting_agent_id]);
    const gossip_chain: GossipNode[] = [];
    const queue: string[] = [starting_agent_id];

    let iterations = 0;
    const MAX_ITERATIONS = 20; // Prevent infinite loops

    while (queue.length > 0 && spread_to.size < max_spread && iterations < MAX_ITERATIONS) {
      iterations++;
      const current_agent = queue.shift()!;
      const personality = agent_personalities.get(current_agent);
      const relationships = agent_relationships.get(current_agent);

      if (!personality || !relationships) continue;

      // Try to gossip to each agent they have a relationship with
      for (const [other_agent_id, relationship] of relationships) {
        if (spread_to.has(other_agent_id)) continue; // Already knows

        const { gossiped, reason } = await this.propagateGossip({
          session_id,
          secret_id,
          from_agent_id: current_agent,
          from_agent_personality: personality,
          to_agent_id: other_agent_id,
          current_relationships: relationships,
        });

        if (gossiped) {
          spread_to.add(other_agent_id);
          queue.push(other_agent_id);

          gossip_chain.push({
            from_agent_id: current_agent,
            to_agent_id: other_agent_id,
            timestamp: new Date().toISOString(),
            context: 'gossip wave',
          });

          if (spread_to.size >= max_spread) break;
        }
      }
    }

    return {
      spread_to: Array.from(spread_to),
      gossip_chain,
    };
  }

  /**
   * Get all secrets an agent owns
   */
  async getAgentOwnSecrets(session_id: string, agent_id: string): Promise<AgentSecret[]> {
    return getAgentSecrets(session_id, agent_id);
  }

  /**
   * Get all secrets an agent knows (including others' secrets)
   */
  async getSecretsKnownBy(session_id: string, agent_id: string): Promise<AgentSecret[]> {
    return getSecretsKnownByAgent(session_id, agent_id);
  }

  /**
   * Check if a secret has been widely exposed
   */
  async isSecretWidelyKnown(secret: AgentSecret, total_agents: number): Promise<boolean> {
    const revealed_count = secret.revealed_to.length;
    const threshold = Math.ceil(total_agents * 0.5); // More than 50% know
    return revealed_count >= threshold;
  }

  /**
   * Get gossip statistics for analysis
   */
  async getGossipStatistics(session_id: string): Promise<{
    total_secrets: number;
    revealed_secrets: number;
    average_spread: number;
    most_gossiped: AgentSecret | null;
  }> {
    // This would require querying all secrets in the session
    // Simplified version - would need to aggregate across all agents
    return {
      total_secrets: 0,
      revealed_secrets: 0,
      average_spread: 0,
      most_gossiped: null,
    };
  }

  /**
   * Generate a scandal scenario - intentionally spread an explosive secret
   */
  async triggerScandal(params: {
    session_id: string;
    agent_id: string;
    scandal_type: 'professional' | 'personal' | 'relationship';
    severity: 'major' | 'explosive';
  }): Promise<AgentSecret> {
    const { session_id, agent_id, scandal_type, severity } = params;

    let content = '';
    
    try {
        // Generate scandal content using AI
        const result = await generateText({
            model: gatewayAnthropic('claude-sonnet-4-5-20250929'),
            maxTokens: 300,
            temperature: 1.0,
            messages: [
                {
                    role: 'user',
                    content: `Generate a scandalous ${severity} ${scandal_type} secret about Agent ${agent_id}.
                    This needs to be shocking, dramatic, and fit for a workplace RPG.
                    Return ONLY the secret text content, no JSON or prefixes.
                    Example: "Secretly sold the company's database to a competitor."`
                }
            ]
        });

        content = result.text.trim();
    } catch (error) {
        console.error('[SecretManager] Failed to generate scandal, falling back to template:', error);
        // Fallback only on error
        const scandalTemplates: Record<string, string> = {
            professional: 'has been sabotaging the project to make others look bad',
            personal: 'has been lying about their qualifications and experience',
            relationship: 'has been secretly dating multiple team members',
        };
        content = `${agent_id} ${scandalTemplates[scandal_type]}`;
    }

    const secret = await createSecret({
      session_id,
      agent_id,
      type: scandal_type,
      severity,
      content,
      consequences_if_revealed: {
        trust_penalties: [{ agent_id: 'all', penalty: 30 }],
        relationship_changes: [
          { agent_id: 'all', change: 'Massive trust loss and potential team breakdown' },
        ],
      },
    });

    return secret as AgentSecret;
  }
}

// Export singleton instance
export const secretManager = new SecretManager();
