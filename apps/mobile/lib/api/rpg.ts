/**
 * RPG API
 */

import { apiClient } from './client';

export async function createSession(data: any) {
  return apiClient('/api/rpg/session', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function voiceCall(data: any) {
  return apiClient('/api/rpg/call/voice', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function textInteraction(data: any) {
  return apiClient('/api/rpg/interaction', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSaves() {
  return apiClient('/api/rpg/saves');
}

export async function getRelationships() {
  return apiClient('/api/rpg/relationships');
}

export async function postSecret(data: any) {
  return apiClient('/api/rpg/secrets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function postScandal(data: any) {
  return apiClient('/api/rpg/scandal', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
