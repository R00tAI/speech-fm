/**
 * RPG Game Mode Types
 *
 * Types for the reality show / RPG game mode featuring:
 * - Agent relationships and dynamics
 * - Private calls between user and agents
 * - Secrets and gossip propagation
 * - Multi-agent chat rooms
 * - Events and notifications
 */

// ============================================================================
// Core RPG Session
// ============================================================================

export type RPGSessionStatus = 'active' | 'paused' | 'completed';
export type GamePhase = 'morning' | 'work' | 'evening' | 'night';

// GameState is exported from rpg-engine.ts
// This is the simplified version - see lib/rpg/rpg-engine.ts for the full version
export interface BasicGameState {
  day: number;
  phase: GamePhase;
  events: GameEvent[];
}

export interface RPGSession {
  session_id: string;
  pipeline_chat_id: string;
  user_id: string;
  scenario_id: string | null;
  status: RPGSessionStatus;
  game_state: GameState;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Relationships & Dynamics
// ============================================================================

export type RelationshipStatus =
  | 'strangers'
  | 'acquaintances'
  | 'friends'
  | 'close_friends'
  | 'best_friends'
  | 'rivals'
  | 'enemies'
  | 'romantic_interest'
  | 'dating';

export type MoodTowards = 'positive' | 'neutral' | 'negative' | 'conflicted';

export interface RelationshipMetrics {
  trust: number; // 0-100
  respect: number; // 0-100
  friendship: number; // 0-100
  rivalry: number; // 0-100
  attraction: number; // 0-100
}

export interface AgentRelationship {
  relationship_id: string;
  session_id: string;
  agent_a_id: string;
  agent_b_id: string;

  // Metrics
  trust: number;
  respect: number;
  friendship: number;
  rivalry: number;
  attraction: number;

  // State
  status: RelationshipStatus;
  interaction_count: number;
  positive_interactions: number;
  negative_interactions: number;
  shared_secrets: string[];

  // Current
  current_mood_towards: MoodTowards;
  last_interaction: string;

  created_at: string;
  updated_at: string;
}

export interface RelationshipChange {
  agent_id: string;
  metric: keyof RelationshipMetrics;
  change: number;
  reason: string;
}

// ============================================================================
// Secrets & Gossip
// ============================================================================

export type SecretType = 'personal' | 'professional' | 'relationship' | 'project' | 'past';
export type SecretSeverity = 'minor' | 'moderate' | 'major' | 'explosive';

export interface GossipNode {
  from_agent_id: string;
  to_agent_id: string;
  timestamp: string;
  context: string; // 'casual', 'urgent', 'malicious', etc.
}

export interface SecretConsequences {
  trust_penalties: Array<{
    agent_id: string;
    penalty: number;
  }>;
  relationship_changes: Array<{
    agent_id: string;
    change: string;
  }>;
}

export interface AgentSecret {
  secret_id: string;
  session_id: string;
  agent_id: string;

  type: SecretType;
  severity: SecretSeverity;

  content: string;
  revealed_to: string[];
  gossip_chain: GossipNode[];

  consequences_if_revealed: SecretConsequences;

  created_at: string;
  revealed_at: string | null;
}

// ============================================================================
// Private Calls
// ============================================================================

export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed';
export type AgentMood = 'happy' | 'stressed' | 'excited' | 'annoyed' | 'neutral' | 'secretive';

export interface TrustImpact {
  agent_id: string;
  change: number;
}

export interface PrivateMessage {
  message_id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;

  // Agent's internal thoughts (RPG flavor)
  internal_thought?: string;

  // Relationship impacts
  trust_impact?: TrustImpact[];
}

export interface PrivateCall {
  call_id: string;
  session_id: string;
  user_id: string;
  agent_id: string;

  status: CallStatus;
  messages: PrivateMessage[];

  // Timing
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;

  // Agent State
  agent_mood: AgentMood;
  willingness_to_share: number; // 0-100

  // Outcomes
  secrets_revealed: string[];
  relationship_changes: RelationshipChange[];
  new_tasks_revealed: string[];
}

export interface CallSummary {
  call_id: string;
  duration: number;
  secrets_learned: number;
  relationships_affected: number;
  key_moments: string[];
}

// ============================================================================
// Chat Rooms (Multi-Agent Conversations)
// ============================================================================

export type ChatRoomType = 'one_on_one' | 'clique' | 'department' | 'emergency' | 'general';
export type MessageTone = 'professional' | 'casual' | 'tense' | 'friendly' | 'passive_aggressive';

export interface ChatRoomMessage {
  message_id: string;
  agent_id: string;
  content: string;
  timestamp: string;

  // Metadata
  intended_audience: 'all' | string[]; // Can whisper
  tone: MessageTone;

  // Hidden subtext (not shown to user but in system prompts)
  hidden_subtext?: string;
}

export interface ChatRoom {
  room_id: string;
  session_id: string;
  name: string;
  participants: string[]; // Agent IDs
  is_private: boolean; // Can user observe?

  room_type: ChatRoomType;
  messages: ChatRoomMessage[];

  created_at: string;
  archived_at: string | null;
}

// ============================================================================
// Events & Notifications
// ============================================================================

export type RPGEventType =
  | 'relationship_change'
  | 'secret_revealed'
  | 'conflict'
  | 'alliance_formed'
  | 'task_completed'
  | 'user_action'
  | 'agent_action'
  | 'gossip_spread'
  | 'trust_penalty'
  | 'friendship_increase'
  | 'rivalry_start'
  | 'romance_spark';

export type NotificationColor = 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'orange';

export interface MetricChange {
  agent_id: string;
  metric: string;
  change: number;
}

export interface EventNotification {
  icon: string;
  color: NotificationColor;
  participants: string[];
  metrics_changed: MetricChange[];
}

export interface RPGEvent {
  event_id: string;
  session_id: string;
  timestamp: string;

  type: RPGEventType;
  title: string;
  description: string;

  notification: EventNotification;
  log_entry: string;
}

export interface GameEvent {
  day: number;
  phase: GamePhase;
  event_type: string;
  description: string;
}

// ============================================================================
// Scenarios
// ============================================================================

export type ScenarioDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert';

export interface TeamMemberConfig {
  role: string;
  personality_preset?: {
    mbti?: string;
    ocean?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
  };
  starting_secrets?: string[];
  starting_relationships?: Array<{
    with_agent: string;
    metrics: Partial<RelationshipMetrics>;
  }>;
}

export interface ScenarioObjective {
  type: 'complete_project' | 'resolve_conflict' | 'prevent_secret_reveal' | 'form_alliance' | 'expose_saboteur';
  description: string;
  success_conditions: Record<string, any>;
}

export interface RPGScenario {
  scenario_id: string;
  name: string;
  description: string;
  difficulty: ScenarioDifficulty;

  team_composition: TeamMemberConfig[];
  objectives: ScenarioObjective[];
  starting_events: GameEvent[];

  created_by: string; // 'system' or user_id
  created_at: string;
  is_public: boolean;
}

export interface ObjectiveStatus {
  objective: ScenarioObjective;
  completed: boolean;
  progress: number; // 0-100
  details: string;
}

// ============================================================================
// Interactions
// ============================================================================

export type InteractionType =
  | 'positive_feedback'
  | 'negative_feedback'
  | 'collaboration'
  | 'conflict'
  | 'gossip'
  | 'support'
  | 'criticism'
  | 'praise'
  | 'secret_shared'
  | 'secret_betrayed';

export interface InteractionParams {
  session_id: string;
  agent_a_id: string;
  agent_b_id: string;
  interaction_type: InteractionType;
  context: string;
  message_content?: string;
}

export interface WillShareParams {
  agent_id: string;
  secret_id: string;
  with_agent_id: string;
  current_relationship: AgentRelationship;
  context: 'private_call' | 'group_chat' | 'gossip';
}

export interface WillShareResult {
  will_share: boolean;
  reason: string;
  conditions?: string[];
}

export interface TrustPenaltyParams {
  session_id: string;
  agent_id: string;
  reason: string;
  severity: number; // 1-100
  affected_agents: string[];
}

// ============================================================================
// Stream Events (extends existing orchestration events)
// ============================================================================

export type RPGStreamEvent =
  | { type: 'rpg_trust_changed'; data: TrustChangeData }
  | { type: 'rpg_secret_revealed'; data: SecretRevealedData }
  | { type: 'rpg_call_started'; data: CallStartedData }
  | { type: 'rpg_call_ended'; data: CallEndedData }
  | { type: 'rpg_conflict_emerged'; data: ConflictData }
  | { type: 'rpg_gossip_spread'; data: GossipData }
  | { type: 'rpg_relationship_updated'; data: RelationshipUpdateData }
  | { type: 'rpg_event_created'; data: RPGEvent };

export interface TrustChangeData {
  session_id: string;
  agent_id: string;
  target_agent_id: string;
  old_value: number;
  new_value: number;
  reason: string;
}

export interface SecretRevealedData {
  session_id: string;
  secret: AgentSecret;
  revealed_by: string;
  revealed_to: string;
  context: string;
}

export interface CallStartedData {
  call_id: string;
  agent_id: string;
  agent_name: string;
  agent_mood: AgentMood;
}

export interface CallEndedData {
  call_id: string;
  summary: CallSummary;
}

export interface ConflictData {
  session_id: string;
  agent_a_id: string;
  agent_b_id: string;
  reason: string;
  severity: number;
}

export interface GossipData {
  session_id: string;
  secret_id: string;
  from_agent_id: string;
  to_agent_id: string;
  context: string;
}

export interface RelationshipUpdateData {
  session_id: string;
  relationship: AgentRelationship;
  changes: RelationshipChange[];
}

// ============================================================================
// Configuration
// ============================================================================

export interface RPGSettings {
  enabled: boolean;
  session_id?: string;

  // Behavior tuning
  gossip_frequency: number; // 0-1, how often agents gossip
  conflict_likelihood: number; // 0-1, how easily conflicts emerge
  secret_generation: boolean; // Auto-generate secrets
  relationship_volatility: number; // 0-1, how quickly relationships change

  // Trust system
  trust_decay_rate: number; // How fast trust decays over time without interaction
  trust_boost_multiplier: number; // Multiplier for positive interactions

  // UI
  show_internal_thoughts: boolean;
  show_relationship_graph: boolean;
  notification_animation_speed: number; // 0.5-2
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface StartCallRequest {
  session_id: string;
  user_id: string;
  agent_id: string;
}

export interface SendMessageRequest {
  call_id: string;
  content: string;
}

export interface CreateRoomRequest {
  session_id: string;
  name: string;
  participants: string[];
  is_private: boolean;
  room_type?: ChatRoomType;
}

export interface InitializeSessionRequest {
  user_id: string;
  scenario_id: string;
  pipeline_chat_id?: string;
}

export interface InitializeSessionResponse {
  session: RPGSession;
  agents: Array<{
    agent_id: string;
    agent_config: any; // AgentConfig from agency.ts
    relationships: AgentRelationship[];
    secrets: AgentSecret[];
  }>;
  scenario: RPGScenario;
}

// ============================================================================
// Lip Sync Integration
// ============================================================================

export type LipSyncStrategy = 'musetalk' | 'wav2lip' | 'rhubarb';

export interface LipSyncParams {
  agent_id: string;
  audio_url?: string;
  audio_stream?: MediaStream;
  avatar_image: string;
}

export interface LipSyncResult {
  video_url: string;
  duration: number;
}

export interface VideoFrame {
  data: ArrayBuffer;
  timestamp: number;
}
