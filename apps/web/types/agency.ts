export type AgentRole =
  | 'project_manager'
  | 'frontend_developer'
  | 'backend_developer'
  | 'full_stack_developer'
  | 'designer'
  | 'ux_researcher'
  | 'qa_engineer'
  | 'devops'
  | 'data_scientist'
  | 'ml_engineer'
  | 'technical_writer'
  | 'product_manager'
  | 'security_engineer'
  | 'mobile_developer'
  | 'content_writer'
  | 'marketing_specialist'
  | 'seo_specialist'
  | 'copywriter'
  | 'social_media_manager';

export type CommunicationStyle =
  | 'professional'
  | 'casual'
  | 'technical'
  | 'creative'
  | 'analytical'
  | 'enthusiastic'
  | 'concise'
  | 'detailed'
  | 'in-character';

export type MBTIType =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface OCEANTraits {
  openness: number; // 0-1: curiosity, creativity, willingness to try new things
  conscientiousness: number; // 0-1: organization, dependability, work ethic
  extraversion: number; // 0-1: sociability, assertiveness, energy level
  agreeableness: number; // 0-1: compassion, cooperation, trust
  neuroticism: number; // 0-1: emotional stability, stress response
}

export interface AgentPersonality {
  mbti: MBTIType;
  ocean: OCEANTraits;
  workingStyle: {
    pace: 'fast' | 'moderate' | 'careful';
    collaboration: 'high' | 'moderate' | 'independent';
    communication: 'verbose' | 'balanced' | 'concise';
    decisionMaking: 'analytical' | 'intuitive' | 'collaborative';
  };
  quirks: string[]; // Unique behavioral traits
  strengths: string[];
  weaknesses: string[];
  motivations: string[];
  workPreferences: {
    bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';
    preferredTaskTypes: string[];
    stressors: string[];
    energizers: string[];
  };
}

export interface AgentBackstory {
  summary: string;
  education: string[];
  experience: string[];
  achievements: string[];
  interests: string[];
  careerJourney: string;
  personalityOrigin: string; // Why they developed their personality
}

export type AgentThinkingStyle = 'succinct' | 'balanced' | 'deliberative' | 'structured' | 'creative' | 'analytical' | 'intuitive';
export type AgentCollaborationVoice = 'supportive' | 'challenger' | 'analyst' | 'scribe';

export interface AgentPromptProfile {
  systemPrompt?: string;
  thinkingStyle?: AgentThinkingStyle;
  collaborationVoice?: AgentCollaborationVoice;
  responseVariability?: number; // 0-1 slider for how unpredictable responses should feel
  typingPace?: number; // Multiplier applied to typing simulator (0.5-2)
  responseFormat?: string; // Preferred response format (bullet points, paragraphs, etc.)
  exampleResponses?: string[]; // Example responses to guide style
}

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

export type TaskCategory =
  | 'planning'
  | 'design'
  | 'frontend'
  | 'backend'
  | 'testing'
  | 'deployment'
  | 'research'
  | 'documentation'
  | 'review'
  | 'bug_fix'
  | 'optimization';

export type MessageType =
  | 'task_assignment'
  | 'status_update'
  | 'question'
  | 'feedback'
  | 'broadcast'
  | 'code_review'
  | 'design_feedback'
  | 'design_created'
  | 'testing_results'
  | 'reasoning_step'
  | 'hypothesis'
  | 'challenge'
  | 'synthesis'
  | 'consensus_proposal';

export type ChannelType =
  | 'general'
  | 'standup'
  | 'code_review'
  | 'design_review'
  | 'brainstorm'
  | 'decision_making'
  | 'dm'; // Direct message channels

export type CollaborationMode =
  | 'explicit' // Agents know about each other and collaborate intentionally
  | 'implicit' // Agents work independently, orchestrator merges insights
  | 'debate'; // Agents challenge and refine each other's ideas

export interface ChannelConfig {
  id: string;
  type: ChannelType;
  name: string;
  description: string;
  participants: string[]; // Agent IDs
  mode: CollaborationMode;
  moderator?: string; // Agent ID who leads the channel
  consensusThreshold: number; // 0-1, when to conclude discussion
  maxTurns?: number; // Optional turn limit
  turnSelection: 'weighted' | 'round_robin' | 'relevance' | 'random' | 'any';
  active: boolean;
}

export interface TurnWeight {
  agentId: string;
  relevanceScore: number; // How relevant their expertise is to current topic
  confidenceScore: number; // How confident their last contribution was
  noveltyScore: number; // How much new information they're contributing
  recentActivityScore: number; // Prefer agents who haven't spoken recently
  totalWeight: number;
}

export interface ConsensusState {
  agreementLevel: number; // 0-1, how much agents agree
  convergingTopics: string[]; // Topics where consensus is forming
  divergingTopics: string[]; // Topics still under debate
  readyForConclusion: boolean;
  synthesizedView?: string; // Combined perspective if consensus reached
}

export interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  backstory: string;
  profileImage?: string;
  communicationStyle: CommunicationStyle;
  tools: string[];
  expertise: string[];
  workingHours?: {
    start: number;
    end: number;
  };
  personality?: AgentPersonality;
  backstoryDetails?: AgentBackstory;
  age?: number;
  location?: string;
  yearsOfExperience?: number;
  promptProfile?: AgentPromptProfile;
}

export type LeadershipStyle = 'visionary' | 'hands-on' | 'delegative' | 'servant';

export interface CEOProfile {
  userId?: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  avatarGenerationSeed?: number;
  avatarTheme?: string;
  communicationPreference: CommunicationStyle;
  expertise: string[];
  leadershipStyle?: LeadershipStyle;
  personality?: AgentPersonality; // Use same rich personality modeling as agents
  companyVision?: string;
  priorities?: string[];
}

export interface ProfileVisibilitySettings {
  showCEOToAgents: boolean;
  showCEOPersonality: boolean;
  showCEOAvatar: boolean;
  showTeammateDetails: 'minimal' | 'standard' | 'rich';
  includeTeammateImages: boolean;
  maxBioLength: number; // 100, 200, or 500
  includePersonalityTraits: boolean;
}

export interface AgentTeam {
  agents: AgentConfig[];
  projectDescription: string;
  theme?: string;
  teamName?: string;
  ceoProfile?: CEOProfile; // User/CEO profile visible to agents
  collaboration: {
    reviewProcess: boolean;
    parallelExecution: boolean;
    crossReview: boolean;
    mode?: CollaborationMode;
  };
  channels?: ChannelConfig[];
}

export interface AgentTask {
  taskId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  dependsOn?: string[];
  estimatedTime?: number;
  actualTime?: number;
  resultData?: any;
  errorMessage?: string;
  reviewers?: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string;
  messageType: MessageType;
  content: string;
  relatedTaskId?: string;
  channelId?: string;
  confidenceScore?: number; // 0-1, how confident the agent is in this statement
  referencesMessageIds?: string[]; // Previous messages this builds upon
  metadata?: any;
  timestamp: Date;
}

export interface OrchestrationConfig {
  chatId: string;
  projectDescription: string;
  agentTeam: AgentTeam;
  maxParallelTasks?: number;
  enableReview?: boolean;
  biasReduction?: {
    multipleReviewers: boolean;
    anonymousReview: boolean;
    diversePerspectives: boolean;
  };
}

export interface StreamEvent {
  type:
    | 'orchestration_started'
    | 'discussion_started'
    | 'discussion_complete'
    | 'agent_started'
    | 'task_assigned'
    | 'task_started'
    | 'task_progress'
    | 'task_completed'
    | 'task_failed'
    | 'communication'
    | 'code_generated'
    | 'design_created'
    | 'review_requested'
    | 'review_completed'
    | 'orchestration_complete'
    | 'error'
    | 'agent_typing_start'
    | 'agent_typing_stop'
    | 'agent_thinking'
    | 'message_chunk'
    | 'message_complete'
    | 'channel_discussion_started'
    | 'channel_discussion_concluded'
    | 'consensus_update'
    | 'task_filtered'
    | 'tool_call'
    | 'tool_result'
    | 'settings_updated'
    | 'chaos_triggered'
    | 'token_usage'
    | 'task_retrying'
    | 'task_blocked'
    | 'cost_alert'
    | 'cost_limit_exceeded'
    | 'orchestration_stuck'
    | 'dependency_cycle_detected'
    | 'reasoning_metrics';
  data: any;
  timestamp: Date;
}

export interface CodeArtifact {
  id: string;
  type: 'component' | 'api' | 'config' | 'test' | 'documentation';
  filename: string;
  language: string;
  code: string;
  description: string;
  author: string;
  reviewedBy?: string[];
  approved: boolean;
}

export interface DesignArtifact {
  id: string;
  type: 'wireframe' | 'mockup' | 'prototype' | 'style-guide' | 'component';
  title: string;
  description: string;
  imageUrl?: string;
  figmaUrl?: string;
  author: string;
  reviewedBy?: string[];
  approved: boolean;
}

export interface TypingAgent {
  agentId: string;
  messageId: string;
  partialMessage: string;
  isThinking: boolean;
}

export interface WorkspaceState {
  activeAgents: string[];
  activeTasks: AgentTask[];
  recentCommunications: AgentMessage[];
  artifacts: {
    code: CodeArtifact[];
    design: DesignArtifact[];
  };
  timeline: StreamEvent[];
  typingAgents: TypingAgent[];
  channels: ChannelConfig[];
  activeChannel?: string; // Currently selected channel ID
  consensusStates: Record<string, ConsensusState>; // By channel ID
  channelLastSeen: Record<string, Date>; // channelId -> last viewed timestamp
  finalSummary?: {
    completedTasks: number;
    totalTasks: number;
    finishedAt: string;
  } | null;
  sessionMetrics?: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalThinkingTokens: number;
    totalCost: number;
    agentBreakdown: Array<{
      agentId: string;
      agentName: string;
      inputTokens: number;
      outputTokens: number;
      thinkingTokens?: number;
      totalTokens: number;
      estimatedCost: number;
    }>;
    startTime: Date;
    currentTime: Date;
    duration: number;
  };
}

export type ReviewIssueSeverity = 'low' | 'medium' | 'high';

export interface ChatReviewIssue {
  id: string;
  field: string;
  severity: ReviewIssueSeverity;
  description: string;
  agentsInvolved: string[];
  evidence: string;
  recommendedAdjustment?: {
    field: string;
    suggestion: string;
  };
}

export interface ChatReviewResult {
  summary: string;
  highlights: string[];
  issues: ChatReviewIssue[];
  recommendedAdjustments: {
    orchestratorSystemPrompt?: string;
    collaborativeThinkingPrompt?: string;
    thinkingControls?: {
      thinkingDepth?: number;
      pauseFrequency?: number;
      collaborationCadence?: number;
      playbackSpeed?: number;
    };
    agentOverrides?: Record<
      string,
      {
        systemPrompt?: string;
        thinkingStyle?: AgentThinkingStyle;
        responseVariability?: number;
        typingPace?: number;
      }
    >;
  };
  warnings?: string[];
  analyzedMessages: number;
  modelUsed: string;
}
