import { eq, and, desc, sql } from 'drizzle-orm';
import db from './connection';
import {
  rpg_sessions,
  rpg_agent_relationships,
  rpg_agent_secrets,
  rpg_private_calls,
  rpg_events,
  rpg_scenarios,
  rpg_chat_rooms,
} from './schema';
import type {
  RPGSession,
  AgentRelationship,
  AgentSecret,
  PrivateCall,
  RPGEvent,
  RPGScenario,
  ChatRoom,
  RelationshipChange,
} from '@/types/rpg';

// ============================================================================
// RPG Sessions
// ============================================================================

export async function createRPGSession(data: {
  pipeline_chat_id?: string;
  user_id: string;
  scenario_id?: string;
}) {
  if (!db) throw new Error('Database not initialized');

  const [session] = await db.insert(rpg_sessions).values({
    pipeline_chat_id: data.pipeline_chat_id || null,
    user_id: data.user_id,
    scenario_id: data.scenario_id || null,
    status: 'active',
  }).returning();

  return session;
}

export async function getRPGSession(session_id: string) {
  if (!db) throw new Error('Database not initialized');

  const [session] = await db
    .select()
    .from(rpg_sessions)
    .where(eq(rpg_sessions.session_id, session_id));

  if (session) {
    return {
      ...session,
      game_state: typeof session.game_state === 'string'
        ? JSON.parse(session.game_state)
        : session.game_state,
    } as RPGSession;
  }

  return null;
}

export async function updateRPGSession(
  session_id: string,
  data: Partial<Pick<RPGSession, 'status' | 'game_state'>>
) {
  if (!db) throw new Error('Database not initialized');

  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.game_state) updateData.game_state = JSON.stringify(data.game_state);

  const [updated] = await db
    .update(rpg_sessions)
    .set(updateData)
    .where(eq(rpg_sessions.session_id, session_id))
    .returning();

  return updated;
}

export async function getUserRPGSessions(user_id: string) {
  if (!db) throw new Error('Database not initialized');

  const sessions = await db
    .select()
    .from(rpg_sessions)
    .where(eq(rpg_sessions.user_id, user_id))
    .orderBy(desc(rpg_sessions.created_at));

  return sessions.map(s => ({
    ...s,
    game_state: typeof s.game_state === 'string' ? JSON.parse(s.game_state) : s.game_state,
  })) as RPGSession[];
}

// ============================================================================
// Agent Relationships
// ============================================================================

export async function createRelationship(data: {
  session_id: string;
  agent_a_id: string;
  agent_b_id: string;
  trust?: number;
  respect?: number;
  friendship?: number;
  rivalry?: number;
  attraction?: number;
}) {
  if (!db) throw new Error('Database not initialized');

  const [relationship] = await db.insert(rpg_agent_relationships).values({
    session_id: data.session_id,
    agent_a_id: data.agent_a_id,
    agent_b_id: data.agent_b_id,
    trust: data.trust ?? 50,
    respect: data.respect ?? 50,
    friendship: data.friendship ?? 50,
    rivalry: data.rivalry ?? 0,
    attraction: data.attraction ?? 0,
    status: 'acquaintances',
    current_mood_towards: 'neutral',
  }).returning();

  return relationship;
}

export async function getRelationship(
  session_id: string,
  agent_a_id: string,
  agent_b_id: string
): Promise<AgentRelationship | null> {
  if (!db) throw new Error('Database not initialized');

  const [relationship] = await db
    .select()
    .from(rpg_agent_relationships)
    .where(
      and(
        eq(rpg_agent_relationships.session_id, session_id),
        sql`(
          (${rpg_agent_relationships.agent_a_id} = ${agent_a_id} AND ${rpg_agent_relationships.agent_b_id} = ${agent_b_id})
          OR
          (${rpg_agent_relationships.agent_a_id} = ${agent_b_id} AND ${rpg_agent_relationships.agent_b_id} = ${agent_a_id})
        )`
      )
    );

  if (relationship) {
    return {
      ...relationship,
      shared_secrets: typeof relationship.shared_secrets === 'string'
        ? JSON.parse(relationship.shared_secrets)
        : relationship.shared_secrets,
    } as AgentRelationship;
  }

  return null;
}

export async function updateRelationship(
  relationship_id: string,
  changes: Partial<AgentRelationship>
) {
  if (!db) throw new Error('Database not initialized');

  const updateData: any = { ...changes };
  if (changes.shared_secrets) {
    updateData.shared_secrets = JSON.stringify(changes.shared_secrets);
  }
  delete updateData.relationship_id;
  delete updateData.session_id;
  delete updateData.created_at;
  delete updateData.updated_at;

  const [updated] = await db
    .update(rpg_agent_relationships)
    .set(updateData)
    .where(eq(rpg_agent_relationships.relationship_id, relationship_id))
    .returning();

  return updated;
}

export async function getAllRelationshipsForAgent(
  session_id: string,
  agent_id: string
): Promise<AgentRelationship[]> {
  if (!db) throw new Error('Database not initialized');

  const relationships = await db
    .select()
    .from(rpg_agent_relationships)
    .where(
      and(
        eq(rpg_agent_relationships.session_id, session_id),
        sql`(${rpg_agent_relationships.agent_a_id} = ${agent_id} OR ${rpg_agent_relationships.agent_b_id} = ${agent_id})`
      )
    );

  return relationships.map(r => ({
    ...r,
    shared_secrets: typeof r.shared_secrets === 'string'
      ? JSON.parse(r.shared_secrets)
      : r.shared_secrets,
  })) as AgentRelationship[];
}

// Alias for consistency
export const getRelationshipBetweenAgents = getRelationship;

export async function getAllRelationshipsInSession(
  session_id: string
): Promise<AgentRelationship[]> {
  if (!db) throw new Error('Database not initialized');

  const relationships = await db
    .select()
    .from(rpg_agent_relationships)
    .where(eq(rpg_agent_relationships.session_id, session_id));

  return relationships.map(r => ({
    ...r,
    shared_secrets: typeof r.shared_secrets === 'string'
      ? JSON.parse(r.shared_secrets)
      : r.shared_secrets,
  })) as AgentRelationship[];
}

// Alias for consistency
export const getRelationshipsForSession = getAllRelationshipsInSession;

// ============================================================================
// Agent Secrets
// ============================================================================

export async function createSecret(data: {
  session_id: string;
  agent_id: string;
  type: string;
  severity: string;
  content: string;
  consequences_if_revealed?: any;
}) {
  if (!db) throw new Error('Database not initialized');

  const [secret] = await db.insert(rpg_agent_secrets).values({
    session_id: data.session_id,
    agent_id: data.agent_id,
    type: data.type,
    severity: data.severity,
    content: data.content,
    consequences_if_revealed: data.consequences_if_revealed
      ? JSON.stringify(data.consequences_if_revealed)
      : undefined,
  }).returning();

  return secret;
}

export async function getSecret(secret_id: string): Promise<AgentSecret | null> {
  if (!db) throw new Error('Database not initialized');

  const [secret] = await db
    .select()
    .from(rpg_agent_secrets)
    .where(eq(rpg_agent_secrets.secret_id, secret_id));

  if (secret) {
    return {
      ...secret,
      revealed_to: typeof secret.revealed_to === 'string'
        ? JSON.parse(secret.revealed_to)
        : secret.revealed_to,
      gossip_chain: typeof secret.gossip_chain === 'string'
        ? JSON.parse(secret.gossip_chain)
        : secret.gossip_chain,
      consequences_if_revealed: typeof secret.consequences_if_revealed === 'string'
        ? JSON.parse(secret.consequences_if_revealed)
        : secret.consequences_if_revealed,
    } as AgentSecret;
  }

  return null;
}

export async function revealSecret(
  secret_id: string,
  to_agent_id: string,
  from_agent_id?: string,
  context?: string
) {
  if (!db) throw new Error('Database not initialized');

  const secret = await getSecret(secret_id);
  if (!secret) throw new Error('Secret not found');

  const revealedTo = secret.revealed_to || [];
  if (!revealedTo.includes(to_agent_id)) {
    revealedTo.push(to_agent_id);
  }

  const gossipChain = secret.gossip_chain || [];
  if (from_agent_id) {
    gossipChain.push({
      from_agent_id,
      to_agent_id,
      timestamp: new Date().toISOString(),
      context: context || 'shared',
    });
  }

  const [updated] = await db
    .update(rpg_agent_secrets)
    .set({
      revealed_to: JSON.stringify(revealedTo),
      gossip_chain: JSON.stringify(gossipChain),
      revealed_at: secret.revealed_at ? undefined : new Date(),
    })
    .where(eq(rpg_agent_secrets.secret_id, secret_id))
    .returning();

  return updated;
}

export async function getAgentSecrets(
  session_id: string,
  agent_id: string
): Promise<AgentSecret[]> {
  if (!db) throw new Error('Database not initialized');

  const secrets = await db
    .select()
    .from(rpg_agent_secrets)
    .where(
      and(
        eq(rpg_agent_secrets.session_id, session_id),
        eq(rpg_agent_secrets.agent_id, agent_id)
      )
    );

  return secrets.map(s => ({
    ...s,
    revealed_to: typeof s.revealed_to === 'string' ? JSON.parse(s.revealed_to) : s.revealed_to,
    gossip_chain: typeof s.gossip_chain === 'string' ? JSON.parse(s.gossip_chain) : s.gossip_chain,
    consequences_if_revealed: typeof s.consequences_if_revealed === 'string'
      ? JSON.parse(s.consequences_if_revealed)
      : s.consequences_if_revealed,
  })) as AgentSecret[];
}

export async function getSecretsKnownByAgent(
  session_id: string,
  agent_id: string
): Promise<AgentSecret[]> {
  if (!db) throw new Error('Database not initialized');

  // Get all secrets where agent is in revealed_to array
  const allSecrets = await db
    .select()
    .from(rpg_agent_secrets)
    .where(eq(rpg_agent_secrets.session_id, session_id));

  const knownSecrets = allSecrets.filter(s => {
    const revealedTo = typeof s.revealed_to === 'string' ? JSON.parse(s.revealed_to) : s.revealed_to;
    return revealedTo.includes(agent_id) || s.agent_id === agent_id;
  });

  return knownSecrets.map(s => ({
    ...s,
    revealed_to: typeof s.revealed_to === 'string' ? JSON.parse(s.revealed_to) : s.revealed_to,
    gossip_chain: typeof s.gossip_chain === 'string' ? JSON.parse(s.gossip_chain) : s.gossip_chain,
    consequences_if_revealed: typeof s.consequences_if_revealed === 'string'
      ? JSON.parse(s.consequences_if_revealed)
      : s.consequences_if_revealed,
  })) as AgentSecret[];
}

export async function getSessionSecrets(session_id: string): Promise<AgentSecret[]> {
  if (!db) throw new Error('Database not initialized');

  const secrets = await db
    .select()
    .from(rpg_agent_secrets)
    .where(eq(rpg_agent_secrets.session_id, session_id));

  return secrets.map(s => ({
    ...s,
    revealed_to: typeof s.revealed_to === 'string' ? JSON.parse(s.revealed_to) : s.revealed_to,
    gossip_chain: typeof s.gossip_chain === 'string' ? JSON.parse(s.gossip_chain) : s.gossip_chain,
    consequences_if_revealed: typeof s.consequences_if_revealed === 'string'
      ? JSON.parse(s.consequences_if_revealed)
      : s.consequences_if_revealed,
  })) as AgentSecret[];
}

// ============================================================================
// Private Calls
// ============================================================================

export async function createPrivateCall(data: {
  session_id: string;
  user_id: string;
  agent_id: string;
  agent_mood?: string;
  willingness_to_share?: number;
}) {
  if (!db) throw new Error('Database not initialized');

  const [call] = await db.insert(rpg_private_calls).values({
    session_id: data.session_id,
    user_id: data.user_id,
    agent_id: data.agent_id,
    status: 'active',
    agent_mood: data.agent_mood || 'neutral',
    willingness_to_share: data.willingness_to_share ?? 50,
  }).returning();

  return call;
}

export async function getPrivateCall(call_id: string): Promise<PrivateCall | null> {
  if (!db) throw new Error('Database not initialized');

  const [call] = await db
    .select()
    .from(rpg_private_calls)
    .where(eq(rpg_private_calls.call_id, call_id));

  if (call) {
    return {
      ...call,
      messages: typeof call.messages === 'string' ? JSON.parse(call.messages) : call.messages,
      secrets_revealed: typeof call.secrets_revealed === 'string'
        ? JSON.parse(call.secrets_revealed)
        : call.secrets_revealed,
      relationship_changes: typeof call.relationship_changes === 'string'
        ? JSON.parse(call.relationship_changes)
        : call.relationship_changes,
      new_tasks_revealed: typeof call.new_tasks_revealed === 'string'
        ? JSON.parse(call.new_tasks_revealed)
        : call.new_tasks_revealed,
    } as PrivateCall;
  }

  return null;
}

export async function addMessageToCall(
  call_id: string,
  message: any
) {
  if (!db) throw new Error('Database not initialized');

  const call = await getPrivateCall(call_id);
  if (!call) throw new Error('Call not found');

  const messages = call.messages || [];
  messages.push(message);

  const [updated] = await db
    .update(rpg_private_calls)
    .set({ messages: JSON.stringify(messages) })
    .where(eq(rpg_private_calls.call_id, call_id))
    .returning();

  return updated;
}

export async function endPrivateCall(
  call_id: string,
  duration_seconds: number,
  secrets_revealed: string[] = [],
  relationship_changes: RelationshipChange[] = []
) {
  if (!db) throw new Error('Database not initialized');

  const [updated] = await db
    .update(rpg_private_calls)
    .set({
      status: 'ended',
      ended_at: new Date(),
      duration_seconds,
      secrets_revealed: JSON.stringify(secrets_revealed),
      relationship_changes: JSON.stringify(relationship_changes),
    })
    .where(eq(rpg_private_calls.call_id, call_id))
    .returning();

  return updated;
}

export async function getAgentCalls(
  session_id: string,
  agent_id: string
): Promise<PrivateCall[]> {
  if (!db) throw new Error('Database not initialized');

  const calls = await db
    .select()
    .from(rpg_private_calls)
    .where(
      and(
        eq(rpg_private_calls.session_id, session_id),
        eq(rpg_private_calls.agent_id, agent_id)
      )
    )
    .orderBy(desc(rpg_private_calls.started_at));

  return calls.map(c => ({
    ...c,
    messages: typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages,
    secrets_revealed: typeof c.secrets_revealed === 'string'
      ? JSON.parse(c.secrets_revealed)
      : c.secrets_revealed,
    relationship_changes: typeof c.relationship_changes === 'string'
      ? JSON.parse(c.relationship_changes)
      : c.relationship_changes,
    new_tasks_revealed: typeof c.new_tasks_revealed === 'string'
      ? JSON.parse(c.new_tasks_revealed)
      : c.new_tasks_revealed,
  })) as PrivateCall[];
}

// ============================================================================
// RPG Events
// ============================================================================

export async function createRPGEvent(data: {
  session_id: string;
  type: string;
  title: string;
  description: string;
  notification: any;
  log_entry: string;
}) {
  if (!db) throw new Error('Database not initialized');

  const [event] = await db.insert(rpg_events).values({
    session_id: data.session_id,
    type: data.type,
    title: data.title,
    description: data.description,
    notification: JSON.stringify(data.notification),
    log_entry: data.log_entry,
  }).returning();

  return event;
}

export async function getSessionEvents(
  session_id: string,
  limit: number = 50
): Promise<RPGEvent[]> {
  if (!db) throw new Error('Database not initialized');

  const events = await db
    .select()
    .from(rpg_events)
    .where(eq(rpg_events.session_id, session_id))
    .orderBy(desc(rpg_events.timestamp))
    .limit(limit);

  return events.map(e => ({
    ...e,
    notification: typeof e.notification === 'string' ? JSON.parse(e.notification) : e.notification,
  })) as RPGEvent[];
}

// ============================================================================
// Scenarios
// ============================================================================

export async function getScenario(scenario_id: string): Promise<RPGScenario | null> {
  if (!db) throw new Error('Database not initialized');

  const [scenario] = await db
    .select()
    .from(rpg_scenarios)
    .where(eq(rpg_scenarios.scenario_id, scenario_id));

  if (scenario) {
    return {
      ...scenario,
      team_composition: typeof scenario.team_composition === 'string'
        ? JSON.parse(scenario.team_composition)
        : scenario.team_composition,
      objectives: typeof scenario.objectives === 'string'
        ? JSON.parse(scenario.objectives)
        : scenario.objectives,
      starting_events: typeof scenario.starting_events === 'string'
        ? JSON.parse(scenario.starting_events)
        : scenario.starting_events,
    } as RPGScenario;
  }

  return null;
}

export async function getAllScenarios(): Promise<RPGScenario[]> {
  if (!db) throw new Error('Database not initialized');

  const scenarios = await db
    .select()
    .from(rpg_scenarios)
    .where(eq(rpg_scenarios.is_public, true))
    .orderBy(rpg_scenarios.difficulty, rpg_scenarios.name);

  return scenarios.map(s => ({
    ...s,
    team_composition: typeof s.team_composition === 'string'
      ? JSON.parse(s.team_composition)
      : s.team_composition,
    objectives: typeof s.objectives === 'string' ? JSON.parse(s.objectives) : s.objectives,
    starting_events: typeof s.starting_events === 'string'
      ? JSON.parse(s.starting_events)
      : s.starting_events,
  })) as RPGScenario[];
}

// ============================================================================
// Chat Rooms
// ============================================================================

export async function createChatRoom(data: {
  session_id: string;
  name: string;
  participants: string[];
  is_private: boolean;
  room_type?: string;
}) {
  if (!db) throw new Error('Database not initialized');

  const [room] = await db.insert(rpg_chat_rooms).values({
    session_id: data.session_id,
    name: data.name,
    participants: JSON.stringify(data.participants),
    is_private: data.is_private,
    room_type: data.room_type || null,
  }).returning();

  return room;
}

export async function getChatRoom(room_id: string): Promise<ChatRoom | null> {
  if (!db) throw new Error('Database not initialized');

  const [room] = await db
    .select()
    .from(rpg_chat_rooms)
    .where(eq(rpg_chat_rooms.room_id, room_id));

  if (room) {
    return {
      ...room,
      participants: typeof room.participants === 'string'
        ? JSON.parse(room.participants)
        : room.participants,
      messages: typeof room.messages === 'string' ? JSON.parse(room.messages) : room.messages,
    } as ChatRoom;
  }

  return null;
}

export async function addMessageToRoom(
  room_id: string,
  message: any
) {
  if (!db) throw new Error('Database not initialized');

  const room = await getChatRoom(room_id);
  if (!room) throw new Error('Room not found');

  const messages = room.messages || [];
  messages.push(message);

  const [updated] = await db
    .update(rpg_chat_rooms)
    .set({ messages: JSON.stringify(messages) })
    .where(eq(rpg_chat_rooms.room_id, room_id))
    .returning();

  return updated;
}

export async function getSessionChatRooms(session_id: string): Promise<ChatRoom[]> {
  if (!db) throw new Error('Database not initialized');

  const rooms = await db
    .select()
    .from(rpg_chat_rooms)
    .where(
      and(
        eq(rpg_chat_rooms.session_id, session_id),
        sql`${rpg_chat_rooms.archived_at} IS NULL`
      )
    );

  return rooms.map(r => ({
    ...r,
    participants: typeof r.participants === 'string' ? JSON.parse(r.participants) : r.participants,
    messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : r.messages,
  })) as ChatRoom[];
}

export async function getChatRoomMessages(room_id: string, limit: number = 100) {
  if (!db) throw new Error('Database not initialized');

  const room = await getChatRoom(room_id);
  if (!room) return [];

  const messages = room.messages || [];
  return messages.slice(-limit);
}
