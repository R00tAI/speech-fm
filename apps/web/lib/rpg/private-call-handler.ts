import { generateText } from 'ai';
import { gatewayAnthropic } from '@/lib/ai/vercel-gateway';
import type {
  PrivateCall,
  PrivateMessage,
  CallSummary,
  AgentMood,
  AgentSecret,
  AgentRelationship,
  RelationshipChange,
} from '@/types/rpg';
import type { AgentConfig } from '@/types/agency';
import {
  createPrivateCall,
  getPrivateCall,
  addMessageToCall,
  endPrivateCall,
} from '@/lib/db/rpg-queries';
import { relationshipEngine } from './relationship-engine';
import { secretManager } from './secret-manager';
import { rpgEventSystem } from './event-system';

/**
 * PrivateCallHandler
 *
 * Manages one-on-one conversations between the user and individual agents.
 *
 * Features:
 * - Personality-driven agent responses
 * - Internal thoughts system (visible to user as RPG flavor)
 * - Secret revelation based on trust
 * - Relationship impact tracking
 * - Mood-dependent behavior
 */
export class PrivateCallHandler {
  constructor() {}

  /**
   * Start a private call with an agent
   */
  async startCall(params: {
    session_id: string;
    user_id: string;
    agent: AgentConfig;
    current_relationships?: AgentRelationship[];
    known_secrets?: AgentSecret[];
  }): Promise<PrivateCall> {
    const { session_id, user_id, agent, current_relationships, known_secrets } = params;

    // Find relationship between user and agent if it exists
    const user_relationship = current_relationships?.find(
      (r) =>
        (r.agent_a_id === agent.id && r.agent_b_id === user_id) ||
        (r.agent_a_id === user_id && r.agent_b_id === agent.id)
    );

    // Determine agent's mood based on relationship (if exists)
    const mood = this.determineInitialMood(user_relationship);

    // Calculate willingness to share based on trust
    const willingness = user_relationship ? user_relationship.metrics?.trust ?? user_relationship.trust ?? 50 : 50;

    const call = await createPrivateCall({
      session_id,
      user_id,
      agent_id: agent.id,
      agent_mood: mood,
      willingness_to_share: willingness,
    });

    // Create event
    await rpgEventSystem.createUserActionEvent(
      session_id,
      'started a call',
      `You initiated a private call with ${agent.name}`,
      [agent.id]
    );

    return call as PrivateCall;
  }

  /**
   * User sends a message in the call
   */
  async sendMessage(params: {
    call_id: string;
    content: string;
  }): Promise<PrivateMessage> {
    const { call_id, content } = params;

    const message: PrivateMessage = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    await addMessageToCall(call_id, message);

    return message;
  }

  /**
   * Agent responds to user message
   */
  async getAgentResponse(params: {
    call_id: string;
    agent: AgentConfig;
    user_message: string;
    conversation_history: PrivateMessage[];
    current_relationships: AgentRelationship[];
    known_secrets: AgentSecret[];
    session_context?: string;
  }): Promise<{
    response: PrivateMessage;
    internal_thought: string;
    relationship_impacts: RelationshipChange[];
    secrets_revealed: string[];
  }> {
    const {
      call_id,
      agent,
      user_message,
      conversation_history,
      current_relationships,
      known_secrets,
      session_context = '',
    } = params;

    const call = await getPrivateCall(call_id);
    if (!call) throw new Error('Call not found');

    // Build system prompt for agent
    const systemPrompt = this.buildAgentSystemPrompt(
      agent,
      call,
      current_relationships,
      known_secrets,
      session_context
    );

    // Build conversation for Claude
    const messages = this.formatConversationHistory(conversation_history, user_message);

    try {
      const result = await generateText({
        model: gatewayAnthropic('claude-sonnet-4-5-20250929'),
        maxTokens: 1500,
        temperature: 0.8,
        system: systemPrompt,
        messages,
      });

      // Parse response (expecting structured format with response and internal thought)
      const parsedResponse = this.parseAgentResponse(result.text);

      // Create message object
      const agentMessage: PrivateMessage = {
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: 'agent',
        content: parsedResponse.response,
        timestamp: new Date().toISOString(),
        internal_thought: parsedResponse.internal_thought,
      };

      // Save message to call
      await addMessageToCall(call_id, agentMessage);

      // Detect if any secrets were revealed
      const secrets_revealed = this.detectSecretsRevealed(
        parsedResponse.response,
        known_secrets
      );

      // Calculate relationship impacts (positive interaction with user)
      const relationship_impacts: RelationshipChange[] = [];

      return {
        response: agentMessage,
        internal_thought: parsedResponse.internal_thought,
        relationship_impacts,
        secrets_revealed,
      };
    } catch (error) {
      console.error('Error getting agent response:', error);

      // Fallback response
      const fallbackMessage: PrivateMessage = {
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: 'agent',
        content: "I'm not sure how to respond to that right now. Can we talk about something else?",
        timestamp: new Date().toISOString(),
        internal_thought: 'System error occurred during response generation.',
      };

      await addMessageToCall(call_id, fallbackMessage);

      return {
        response: fallbackMessage,
        internal_thought: 'System error occurred.',
        relationship_impacts: [],
        secrets_revealed: [],
      };
    }
  }

  /**
   * Get a call by ID
   */
  async getCallById(call_id: string): Promise<PrivateCall | null> {
    return await getPrivateCall(call_id);
  }

  /**
   * Get call messages
   */
  async getCallMessages(call_id: string): Promise<PrivateMessage[]> {
    const call = await getPrivateCall(call_id);
    return call?.messages || [];
  }

  /**
   * End the call and generate summary
   */
  async endCall(params: {
    call_id: string;
    agent: AgentConfig;
    conversation_history?: PrivateMessage[];
    current_relationships?: AgentRelationship[];
    known_secrets?: AgentSecret[];
  }): Promise<{ summary: CallSummary }> {
    const { call_id, agent, conversation_history, current_relationships, known_secrets } = params;

    const call = await getPrivateCall(call_id);
    if (!call) throw new Error('Call not found');

    const duration = Math.floor(
      (new Date().getTime() - new Date(call.started_at).getTime()) / 1000
    );

    // Count secrets and relationship changes
    const secrets_revealed = call.secrets_revealed || [];
    const relationship_changes = call.relationship_changes || [];
    const secrets_learned = secrets_revealed.length;
    const relationships_affected = relationship_changes.length;

    // Extract key moments from conversation
    const messages = conversation_history || call.messages || [];
    const key_moments = this.extractKeyMoments(messages);

    await endPrivateCall(
      call_id,
      duration,
      secrets_revealed,
      relationship_changes
    );

    const summary: CallSummary = {
      call_id,
      duration,
      secrets_learned,
      relationships_affected,
      key_moments,
      overall_summary: `Call with ${agent.name} lasted ${duration} seconds. ${secrets_learned} secrets learned, ${relationships_affected} relationship changes.`,
    };

    return { summary };
  }

  /**
   * Build system prompt for agent in private call
   */
  private buildAgentSystemPrompt(
    agent: AgentConfig,
    call: PrivateCall,
    relationships: AgentRelationship[],
    secrets: AgentSecret[],
    session_context: string
  ): string {
    const personality = agent.personality
      ? `MBTI: ${agent.personality.mbti}\nTraits:\n- Openness: ${agent.personality.ocean.openness.toFixed(2)}\n- Conscientiousness: ${agent.personality.ocean.conscientiousness.toFixed(2)}\n- Extraversion: ${agent.personality.ocean.extraversion.toFixed(2)}\n- Agreeableness: ${agent.personality.ocean.agreeableness.toFixed(2)}\n- Neuroticism: ${agent.personality.ocean.neuroticism.toFixed(2)}`
      : 'Standard personality';

    const backstory = agent.backstoryDetails?.summary || 'No specific backstory';

    const relationshipsSummary = relationships.map(rel => {
      return `- ${rel.agent_b_id}: Trust ${rel.trust}/100, Friendship ${rel.friendship}/100, Status: ${rel.status}`;
    }).join('\n');

    const secretsList = secrets
      .filter(s => s.agent_id === agent.id) // Only own secrets
      .map(s => `- [${s.severity}] ${s.content}`)
      .join('\n');

    const knownOthersSecrets = secrets
      .filter(s => s.agent_id !== agent.id && s.revealed_to.includes(agent.id))
      .map(s => `- About ${s.agent_id}: ${s.content}`)
      .join('\n');

    return `You are ${agent.name}, a ${agent.role} in an RPG-style team simulation.

**YOUR PERSONALITY:**
${personality}

**YOUR BACKSTORY:**
${backstory}

**CURRENT SITUATION:**
You're having a private call with the user (the team lead/manager). This is a one-on-one conversation.
${session_context}

**YOUR CURRENT MOOD:** ${call.agent_mood}
**YOUR WILLINGNESS TO SHARE:** ${call.willingness_to_share}/100

**YOUR RELATIONSHIPS WITH TEAM MEMBERS:**
${relationshipsSummary || 'No established relationships yet'}

**YOUR SECRETS:**
${secretsList || 'You have no secrets (yet)'}

**SECRETS YOU KNOW ABOUT OTHERS:**
${knownOthersSecrets || 'You don\'t know any secrets about others'}

**BEHAVIORAL GUIDELINES:**
1. **Stay in character** - Your personality determines how you communicate
2. **Trust matters** - Only share secrets if trust with user is high enough (current willingness: ${call.willingness_to_share}/100)
   - Below 50: Be guarded, don't reveal anything sensitive
   - 50-70: Share minor concerns if asked directly
   - 70+: Be more open, might reveal secrets voluntarily
3. **Express genuine feelings** - About teammates, the project, your role
4. **Gossip realistically** - Your agreeableness (${agent.personality?.ocean.agreeableness.toFixed(2) || 'unknown'}) determines if you gossip
5. **Show mood** - Your current mood (${call.agent_mood}) affects your tone
6. **Be human** - Show emotions, hesitations, concerns

**CRITICAL: RESPONSE FORMAT**
You must respond in this exact format:

<response>
[Your actual spoken response to the user - what you say out loud in the conversation]
</response>

<internal_thought>
[Your private thoughts that the user will see as "RPG flavor" - your internal monologue about what you're thinking, whether you should share something, how you feel, etc. Be honest and revealing here.]
</internal_thought>

**EXAMPLE:**
User: "Hey Sarah, how's the project going?"

<response>
"Honestly? I'm a bit worried. The backend team keeps missing deadlines, and I'm not sure if we can ship on time."
</response>

<internal_thought>
Should I tell them about Tony's bug? They seem trustworthy, but if Tony finds out I snitched, our relationship will be ruined. Maybe I should just hint at it and see how they react...
</internal_thought>

Now respond to the user as ${agent.name}.`;
  }

  /**
   * Format conversation history for Claude API
   */
  private formatConversationHistory(
    history: PrivateMessage[],
    new_user_message: string
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add history
    for (const msg of history) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.sender === 'agent' ? this.formatAgentMessageForHistory(msg) : msg.content,
      });
    }

    // Add new user message
    messages.push({
      role: 'user',
      content: new_user_message,
    });

    return messages;
  }

  /**
   * Format agent message for history (combine response + internal thought)
   */
  private formatAgentMessageForHistory(msg: PrivateMessage): string {
    return `<response>\n${msg.content}\n</response>\n\n<internal_thought>\n${msg.internal_thought || 'No internal thought recorded'}\n</internal_thought>`;
  }

  /**
   * Parse agent response from Claude
   */
  private parseAgentResponse(text: string): {
    response: string;
    internal_thought: string;
  } {
    const responseMatch = text.match(/<response>([\s\S]*?)<\/response>/);
    const thoughtMatch = text.match(/<internal_thought>([\s\S]*?)<\/internal_thought>/);

    return {
      response: responseMatch ? responseMatch[1].trim() : text,
      internal_thought: thoughtMatch ? thoughtMatch[1].trim() : 'No internal thought',
    };
  }

  /**
   * Determine initial mood based on relationship
   */
  private determineInitialMood(relationship?: AgentRelationship): AgentMood {
    if (!relationship) return 'neutral';

    const { trust, friendship, rivalry } = relationship;

    if (rivalry > 60) return 'annoyed';
    if (trust < 30) return 'secretive';
    if (friendship > 70 && trust > 60) return 'happy';
    if (trust > 70) return 'excited';

    return 'neutral';
  }

  /**
   * Detect if agent revealed any secrets in their response
   */
  private detectSecretsRevealed(response: string, known_secrets: AgentSecret[]): string[] {
    const revealed: string[] = [];

    // Simple keyword matching (could be enhanced with semantic similarity)
    for (const secret of known_secrets) {
      const keywords = secret.content.toLowerCase().split(' ');
      const matchCount = keywords.filter(keyword =>
        keyword.length > 4 && response.toLowerCase().includes(keyword)
      ).length;

      // If significant overlap, consider secret revealed
      if (matchCount > 3) {
        revealed.push(secret.secret_id);
      }
    }

    return revealed;
  }

  /**
   * Extract key moments from conversation
   */
  private extractKeyMoments(messages: PrivateMessage[]): string[] {
    const moments: string[] = [];

    for (const msg of messages) {
      // Key moments: secrets mentioned, strong emotions, relationship changes
      if (msg.internal_thought && msg.internal_thought.length > 50) {
        moments.push(msg.internal_thought.substring(0, 100) + '...');
      }
    }

    return moments.slice(-3); // Last 3 key moments
  }
}

// Export singleton instance
export const privateCallHandler = new PrivateCallHandler();
