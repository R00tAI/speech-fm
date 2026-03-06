import { generateText } from 'ai';
import { gatewayAnthropic } from '@/lib/ai/vercel-gateway';
import type {
  RPGSession,
  AgentRelationship,
  AgentSecret,
  PrivateCall,
  RPGScenario,
  RPGEvent,
  InteractionType,
  RelationshipChange,
  RPGChatRoom,
} from '@/types/rpg';
import type { AgentConfig } from '@/types/agency';
import {
  createRPGSession,
  getRPGSession,
  updateRPGSession,
  createRelationship,
  getRelationshipsForSession,
  getRelationshipBetweenAgents,
  getSessionSecrets,
  getScenario,
  createChatRoom,
  getChatRoomMessages,
} from '@/lib/db/rpg-queries';
import { relationshipEngine } from './relationship-engine';
import { rpgEventSystem } from './event-system';
import { secretManager } from './secret-manager';
import { privateCallHandler } from './private-call-handler';
import { voiceCallHandler } from './voice-call-handler';

/**
 * RPGEngine - Main orchestrator for the RPG game mode
 *
 * Coordinates all RPG systems:
 * - RelationshipEngine: Trust, friendship, rivalry calculations
 * - RPGEventSystem: Event creation and broadcasting
 * - SecretManager: Secret generation and gossip propagation
 * - PrivateCallHandler: One-on-one conversations (text)
 * - VoiceCallHandler: Voice-based conversations (ElevenLabs)
 *
 * Provides high-level API for:
 * - Starting sessions
 * - Running scenarios
 * - Processing interactions
 * - Managing game state
 */

export interface StartSessionParams {
  user_id: string;
  scenario_id?: string;
  agents: AgentConfig[];
  session_name?: string;
}

export interface ProcessInteractionParams {
  session_id: string;
  agent_a_id: string;
  agent_b_id: string;
  interaction_type: InteractionType;
  context: string;
  task_context?: any;
}

export interface StartPrivateCallParams {
  session_id: string;
  user_id: string;
  agent: AgentConfig;
  use_voice?: boolean;
}

export interface GameState {
  session: RPGSession;
  relationships: AgentRelationship[];
  secrets: AgentSecret[];
  recent_events: RPGEvent[];
  active_conflicts: Array<{
    agent_a: string;
    agent_b: string;
    rivalry_score: number;
  }>;
  active_alliances: Array<{
    agent_a: string;
    agent_b: string;
    friendship_score: number;
  }>;
}

export class RPGEngine {
  /**
   * Start a new RPG session
   * Initializes relationships, generates secrets, and sets up scenario
   */
  async startSession(params: StartSessionParams): Promise<{
    session: RPGSession;
    initial_secrets_generated: number;
    relationships_initialized: number;
  }> {
    const { user_id, scenario_id, agents, session_name } = params;

    // 1. Load scenario if provided
    let scenario: RPGScenario | null = null;
    if (scenario_id) {
      scenario = await getScenario(scenario_id);
    }

    // 2. Create session
    const session = await createRPGSession({
      user_id,
      scenario_id: scenario_id || null,
    });

    // 3. Initialize relationships between all agents
    let relationships_count = 0;
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const agent_a = agents[i];
        const agent_b = agents[j];

        // Calculate initial compatibility
        const compatibility =
          relationshipEngine.calculatePersonalityCompatibility(
            agent_a.personality!,
            agent_b.personality!
          );

        // Create bidirectional relationship
        await createRelationship({
          session_id: session.id,
          agent_a_id: agent_a.id,
          agent_b_id: agent_b.id,
          metrics: {
            trust: 50 + compatibility * 10, // Start near 50, adjusted by compatibility
            friendship: 40 + compatibility * 5,
            rivalry: 0,
            romance: 0,
            professional_respect: 50,
          },
          status: 'acquaintances',
          history: [],
        });

        relationships_count++;
      }
    }

    // 4. Generate initial secrets for each agent
    let secrets_count = 0;
    for (const agent of agents) {
      try {
        const secrets = await secretManager.generateSecretsForAgent({
          session_id: session.id,
          agent,
          scenario_context: scenario?.description || 'Professional software development team',
        });
        secrets_count += secrets.length;
      } catch (error) {
        console.error(`Failed to generate secrets for ${agent.id}:`, error);
      }
    }

    // 5. Create session start event
    await rpgEventSystem.createEvent({
      session_id: session.id,
      event_type: 'session_start',
      agent_ids: agents.map((a) => a.id),
      description: `Started new RPG session: ${session.session_name}`,
      metadata: {
        scenario: scenario?.name,
        agent_count: agents.length,
      },
    });

    return {
      session,
      initial_secrets_generated: secrets_count,
      relationships_initialized: relationships_count,
    };
  }

  /**
   * Process an interaction between two agents
   * Updates relationships, creates events, handles gossip propagation
   */
  async processInteraction(
    params: ProcessInteractionParams
  ): Promise<{
    relationship_changes: RelationshipChange[];
    events_created: RPGEvent[];
    gossip_spread: boolean;
  }> {
    const {
      session_id,
      agent_a_id,
      agent_b_id,
      interaction_type,
      context,
      task_context,
    } = params;

    // 1. Get current relationship
    const relationship = await getRelationshipBetweenAgents(
      session_id,
      agent_a_id,
      agent_b_id
    );

    if (!relationship) {
      throw new Error(
        `No relationship found between ${agent_a_id} and ${agent_b_id}`
      );
    }

    // 2. Process interaction through RelationshipEngine
    const changes = await relationshipEngine.processInteraction({
      session_id,
      relationship,
      agent_a_id,
      agent_b_id,
      interaction_type,
      context,
      task_context,
    });

    // 3. Create events for significant changes
    const events: RPGEvent[] = [];

    for (const change of changes) {
      // Only create events for significant changes (|delta| >= 5)
      if (Math.abs(change.delta) >= 5) {
        const event = await rpgEventSystem.createRelationshipChangeEvent({
          session_id,
          agent_a_id,
          agent_b_id,
          metric: change.metric,
          change: change.delta,
          reason: context,
        });
        events.push(event);
      }
    }

    // 4. Check if interaction might trigger gossip
    let gossip_spread = false;
    if (
      interaction_type === 'conflict' ||
      interaction_type === 'betrayal' ||
      interaction_type === 'romantic_advance'
    ) {
      const all_relationships = await getRelationshipsForSession(session_id);
      const all_secrets = await getSessionSecrets(session_id);

      // Try to spread gossip about this interaction
      try {
        const gossip_result = await secretManager.propagateGossip({
          session_id,
          secret_id: `interaction_${Date.now()}`, // Create pseudo-secret for interaction
          source_agent_id: agent_a_id,
          target_agent_id: agent_b_id,
          all_relationships,
          all_secrets,
        });

        if (gossip_result.agents_who_learned.length > 0) {
          gossip_spread = true;

          // Create gossip event
          const gossip_event = await rpgEventSystem.createGossipSpreadEvent({
            session_id,
            secret_id: `interaction_${Date.now()}`,
            source_agent_id: agent_a_id,
            target_agent_id: agent_b_id,
            agents_who_learned: gossip_result.agents_who_learned,
          });
          events.push(gossip_event);
        }
      } catch (error) {
        console.error('Error propagating gossip:', error);
      }
    }

    // 5. Check for conflict or alliance emergence
    const updated_relationship = await getRelationshipBetweenAgents(
      session_id,
      agent_a_id,
      agent_b_id
    );

    if (updated_relationship) {
      const conflict_detected = relationshipEngine.detectConflictEmergence(
        updated_relationship
      );
      if (conflict_detected) {
        const conflict_event = await rpgEventSystem.createConflictEvent({
          session_id,
          agent_a_id,
          agent_b_id,
          conflict_type: 'rivalry',
          severity: updated_relationship.metrics.rivalry,
        });
        events.push(conflict_event);
      }

      // Check for alliance (high friendship + high trust)
      if (
        updated_relationship.metrics.friendship > 70 &&
        updated_relationship.metrics.trust > 70
      ) {
        const alliance_event = await rpgEventSystem.createAllianceEvent({
          session_id,
          agent_a_id,
          agent_b_id,
          alliance_strength:
            (updated_relationship.metrics.friendship +
              updated_relationship.metrics.trust) /
            2,
        });
        events.push(alliance_event);
      }

      // Check for romance spark
      if (updated_relationship.metrics.romance > 60) {
        const romance_event = await rpgEventSystem.createRomanceSparkEvent({
          session_id,
          agent_a_id,
          agent_b_id,
          romance_level: updated_relationship.metrics.romance,
        });
        events.push(romance_event);
      }
    }

    return {
      relationship_changes: changes,
      events_created: events,
      gossip_spread,
    };
  }

  /**
   * Start a private call between user and agent
   * Returns call object that can be used for text or voice interactions
   */
  async startPrivateCall(params: StartPrivateCallParams): Promise<{
    call: PrivateCall;
    agent_mood: string;
    relationship_status: string;
  }> {
    const { session_id, user_id, agent, use_voice } = params;

    // Get current relationships and secrets for context
    const relationships = await getRelationshipsForSession(session_id);
    const secrets = await getSessionSecrets(session_id);

    // Start call through PrivateCallHandler
    const call = await privateCallHandler.startCall({
      session_id,
      user_id,
      agent,
      current_relationships: relationships,
      known_secrets: secrets,
    });

    // Get relationship with user (if exists)
    let relationship_status = 'stranger';
    const user_relationship = relationships.find(
      (r) =>
        (r.agent_a_id === agent.id && r.agent_b_id === user_id) ||
        (r.agent_a_id === user_id && r.agent_b_id === agent.id)
    );

    if (user_relationship) {
      relationship_status = user_relationship.status;
    }

    return {
      call,
      agent_mood: call.agent_mood,
      relationship_status,
    };
  }

  /**
   * Send a message in a private call (text-based)
   */
  async sendCallMessage(params: {
    call_id: string;
    user_message: string;
    agent: AgentConfig;
  }): Promise<{
    agent_response: string;
    internal_thought: string;
    secrets_revealed: string[];
  }> {
    const { call_id, user_message, agent } = params;

    // Get call context
    const call = await privateCallHandler.getCallById(call_id);
    if (!call) {
      throw new Error(`Call ${call_id} not found`);
    }

    const relationships = await getRelationshipsForSession(call.session_id);
    const secrets = await getSessionSecrets(call.session_id);
    const conversation_history = await privateCallHandler.getCallMessages(
      call_id
    );

    // Get agent response
    const response = await privateCallHandler.getAgentResponse({
      call_id,
      agent,
      user_message,
      conversation_history,
      current_relationships: relationships,
      known_secrets: secrets,
    });

    // Track revealed secrets
    const secrets_revealed: string[] = [];
    // Simple check: if internal thought mentions revealing something
    if (
      response.internal_thought.toLowerCase().includes('tell') ||
      response.internal_thought.toLowerCase().includes('share') ||
      response.internal_thought.toLowerCase().includes('reveal')
    ) {
      // Mark relevant secrets as potentially revealed
      // This is simplified - in production, use more sophisticated detection
      const agent_secrets = secrets.filter(
        (s) => s.owner_agent_id === agent.id && !s.is_exposed
      );
      if (agent_secrets.length > 0) {
        secrets_revealed.push(agent_secrets[0].id); // Mark first secret as revealed
      }
    }

    return {
      agent_response: response.response.content,
      internal_thought: response.internal_thought,
      secrets_revealed,
    };
  }

  /**
   * Send a voice message in a private call
   */
  async sendVoiceCallMessage(params: {
    call_id: string;
    audio_buffer: Buffer;
    agent: AgentConfig;
  }): Promise<{
    transcribed_text: string;
    agent_response_text: string;
    agent_response_audio: Buffer;
    internal_thought: string;
    audio_duration_ms: number;
  }> {
    const { call_id, audio_buffer, agent } = params;

    // Get call context
    const call = await privateCallHandler.getCallById(call_id);
    if (!call) {
      throw new Error(`Call ${call_id} not found`);
    }

    const relationships = await getRelationshipsForSession(call.session_id);
    const secrets = await getSessionSecrets(call.session_id);
    const conversation_history = await privateCallHandler.getCallMessages(
      call_id
    );

    // Handle voice interaction
    const result = await voiceCallHandler.handleVoiceInteraction({
      call_id,
      audio_buffer,
      agent,
      conversation_history,
      relationships,
      secrets,
    });

    return result;
  }

  /**
   * End a private call and generate summary
   */
  async endPrivateCall(params: {
    call_id: string;
    agent: AgentConfig;
  }): Promise<{
    summary: string;
    relationship_change: RelationshipChange | null;
    trust_change: number;
  }> {
    const { call_id, agent } = params;

    // Get call context
    const call = await privateCallHandler.getCallById(call_id);
    if (!call) {
      throw new Error(`Call ${call_id} not found`);
    }

    const relationships = await getRelationshipsForSession(call.session_id);
    const secrets = await getSessionSecrets(call.session_id);
    const conversation_history = await privateCallHandler.getCallMessages(
      call_id
    );

    // End call and get summary
    const result = await privateCallHandler.endCall({
      call_id,
      agent,
      conversation_history,
      current_relationships: relationships,
      known_secrets: secrets,
    });

    // Calculate relationship change from call
    let relationship_change: RelationshipChange | null = null;
    let trust_change = 0;

    // Simple heuristic: positive calls increase trust, negative decrease
    if (result.summary.key_moments.some((m) => m.includes('revealed'))) {
      trust_change = 5; // Sharing secrets builds trust
    } else if (result.summary.key_moments.some((m) => m.includes('tense'))) {
      trust_change = -5;
    } else {
      trust_change = 2; // Normal conversation builds slight trust
    }

    // Apply trust change if there's a relationship
    const user_id = call.user_id;
    const relationship = await getRelationshipBetweenAgents(
      call.session_id,
      agent.id,
      user_id
    );

    if (relationship && trust_change !== 0) {
      relationship_change = {
        metric: 'trust',
        old_value: relationship.metrics.trust,
        new_value: relationship.metrics.trust + trust_change,
        delta: trust_change,
        reason: 'Private call interaction',
      };

      // Update relationship
      await relationshipEngine.processInteraction({
        session_id: call.session_id,
        relationship,
        agent_a_id: agent.id,
        agent_b_id: user_id,
        interaction_type: trust_change > 0 ? 'collaboration' : 'disagreement',
        context: 'Private call',
      });
    }

    return {
      summary: result.summary.overall_summary,
      relationship_change,
      trust_change,
    };
  }

  /**
   * Get current game state for a session
   * Useful for UI/dashboard rendering
   */
  async getGameState(session_id: string): Promise<GameState> {
    const session = await getRPGSession(session_id);
    if (!session) {
      throw new Error(`Session ${session_id} not found`);
    }

    const relationships = await getRelationshipsForSession(session_id);
    const secrets = await getSessionSecrets(session_id);
    const recent_events = await rpgEventSystem.getRecentEvents(session_id, 20);

    // Detect active conflicts (rivalry > 50)
    const active_conflicts = relationships
      .filter((r) => r.metrics.rivalry > 50)
      .map((r) => ({
        agent_a: r.agent_a_id,
        agent_b: r.agent_b_id,
        rivalry_score: r.metrics.rivalry,
      }))
      .sort((a, b) => b.rivalry_score - a.rivalry_score);

    // Detect active alliances (friendship > 70 && trust > 60)
    const active_alliances = relationships
      .filter((r) => r.metrics.friendship > 70 && r.metrics.trust > 60)
      .map((r) => ({
        agent_a: r.agent_a_id,
        agent_b: r.agent_b_id,
        friendship_score: r.metrics.friendship,
      }))
      .sort((a, b) => b.friendship_score - a.friendship_score);

    return {
      session,
      relationships,
      secrets,
      recent_events,
      active_conflicts,
      active_alliances,
    };
  }

  /**
   * Trigger a scandal (intentional drama injection)
   * Useful for scenarios or user-triggered events
   */
  async triggerScandal(params: {
    session_id: string;
    secret_id: string;
    exposer_agent_id?: string;
  }): Promise<{
    affected_relationships: number;
    events_created: RPGEvent[];
    trust_penalties_applied: number;
  }> {
    const { session_id, secret_id, exposer_agent_id } = params;

    const relationships = await getRelationshipsForSession(session_id);
    const secrets = await getSessionSecrets(session_id);

    const result = await secretManager.triggerScandal({
      session_id,
      secret_id,
      exposer_agent_id,
      all_relationships: relationships,
      all_secrets: secrets,
    });

    return {
      affected_relationships: result.affected_relationships.length,
      events_created: result.events_created,
      trust_penalties_applied: result.trust_penalties_applied,
    };
  }

  /**
   * Create a multi-agent chat room
   * Allows observing agents talking to each other
   */
  async createChatRoom(params: {
    session_id: string;
    room_name: string;
    participant_agent_ids: string[];
    topic: string;
  }): Promise<RPGChatRoom> {
    return await createChatRoom(params);
  }

  /**
   * Simulate agents talking in a chat room
   * Generates AI-driven conversations between agents
   */
  async simulateChatRoomConversation(params: {
    chat_room_id: string;
    message_count: number;
    agents: AgentConfig[];
  }): Promise<Array<{ agent_id: string; message: string }>> {
    const { message_count, agents } = params;

    // Get chat room topic
    const room = await getChatRoomMessages(params.chat_room_id);
    const context = room.length > 0 ? room.map(m => `${m.agent_id}: ${m.content}`).join('\n') : 'No messages yet.';
    
    const systemPrompt = `You are an RPG Game Master simulating a conversation between multiple agents.
Agents in this room:
${agents.map(a => `- ${a.name} (${a.role}): ${a.personality?.mbti || 'Unknown'} - ${a.backstory.substring(0, 50)}...`).join('\n')}

Generate a realistic, dramatic conversation script between these agents.
The script should contain exactly ${message_count} lines.
Each line must be prefixed with "AgentName: Message".
The conversation should be driven by their personalities, hidden agendas, and relationships.

Format:
AgentName: [Message content]
AgentName: [Message content]
...`;

    const { text } = await generateText({
      model: gatewayAnthropic('claude-sonnet-4-20250514'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Continue the conversation based on this context:\n${context}` },
      ],
    });

    const lines = text.split('\n').filter(line => line.includes(': '));
    const messages: Array<{ agent_id: string; message: string }> = [];

    for (const line of lines) {
      const [name, ...contentParts] = line.split(': ');
      const content = contentParts.join(': ').trim();
      const agent = agents.find(a => a.name === name.trim());
      
      if (agent && content) {
        messages.push({
          agent_id: agent.id,
          message: content,
        });
      }
    }

    return messages;
  }
}

// Export singleton instance
export const rpgEngine = new RPGEngine();
