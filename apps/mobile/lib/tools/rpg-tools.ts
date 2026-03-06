/**
 * RPG Tools
 * Ported from Voice31RPGTools.ts - removed Web Audio API, DOM refs
 * Mobile version focuses on state management tools
 */

import { useRPGStore, NPC_VOICE_LIBRARY } from '@/stores/rpg-store';
import type {
  NPCharacter,
  InventoryItem,
  Quest,
  QuestObjective,
  DialogueOption,
  ItemRarity,
} from '@/stores/rpg-store';
import { apiClient } from '@/lib/api/client';

// =============================================================================
// TYPES
// =============================================================================

export interface RPGToolCallResult {
  success: boolean;
  message: string;
  context?: Record<string, unknown>;
}

export interface RPGToolCallHandler {
  handleToolCall: (name: string, args: Record<string, any>) => Promise<RPGToolCallResult>;
}

// =============================================================================
// TOOL HANDLER
// =============================================================================

export function createRPGToolHandler(): RPGToolCallHandler {
  return {
    handleToolCall: async (name: string, args: Record<string, any>): Promise<RPGToolCallResult> => {
      const store = useRPGStore.getState();
      let result: RPGToolCallResult;

      try {
        switch (name) {
          case 'set_scene': {
            const locationName = args.location_name as string;
            const backgroundPrompt = args.background_prompt as string;
            const ambientEffect = args.ambient_effect as any;

            // Generate background image via API
            let backgroundUrl: string | undefined;
            try {
              const response = await apiClient<{ media: { url: string }[] }>('/api/voice-canvas/generate-media', {
                method: 'POST',
                body: JSON.stringify({
                  type: 'image',
                  prompt: backgroundPrompt,
                  style: 'fantasy_landscape',
                  forceSchnell: true,
                }),
              });
              backgroundUrl = response.media?.[0]?.url;
            } catch (e) {
              console.warn('[RPGTools] Background generation failed:', e);
            }

            store.setScene({
              locationName,
              backgroundPrompt,
              backgroundUrl,
              ambientEffect,
            });

            result = {
              success: true,
              message: `Scene set: ${locationName}`,
              context: { locationName, backgroundUrl },
            };
            break;
          }

          case 'show_npc': {
            const name = args.name as string;
            const portraitPrompt = args.portrait_prompt as string;
            const voiceType = args.voice_type as string;
            const title = args.title as string | undefined;
            const position = (args.position as NPCharacter['position']) || 'center';
            const relationship = (args.relationship as number) || 50;
            const race = (args.race as string) || 'human';
            const personality = args.personality as string | undefined;

            const voiceProfile = NPC_VOICE_LIBRARY.find(v => v.id === voiceType);
            const npcId = name.toLowerCase().replace(/\s+/g, '_');

            // Generate portrait via API
            let portraitUrl: string | undefined;
            try {
              const response = await apiClient<{ media: { url: string }[] }>('/api/voice-canvas/generate-media', {
                method: 'POST',
                body: JSON.stringify({
                  type: 'image',
                  prompt: portraitPrompt,
                  style: 'fantasy_portrait',
                  forceSchnell: true,
                }),
              });
              portraitUrl = response.media?.[0]?.url;
            } catch (e) {
              console.warn('[RPGTools] Portrait generation failed:', e);
            }

            const npc: NPCharacter = {
              id: npcId,
              name,
              title,
              race,
              description: portraitPrompt,
              personality: personality ? personality.split(',').map(p => p.trim()) : [],
              portraitUrl,
              portraitPrompt,
              voiceId: voiceProfile?.voiceId || NPC_VOICE_LIBRARY[0].voiceId,
              voiceName: voiceProfile?.name,
              relationship,
              isVisible: true,
              position,
              isSpeaking: false,
              dialogueHistory: [],
            };

            store.addNPC(npc);

            result = {
              success: true,
              message: `NPC "${name}" entered the scene`,
              context: { npcId, voiceId: npc.voiceId, npcName: name },
            };
            break;
          }

          case 'npc_speak': {
            const npcId = args.npc_id as string;
            const dialogue = args.dialogue as string;
            const emotion = args.emotion as string | undefined;

            const npc = store.activeScene.activeNPCs.find(
              n => n.id === npcId || n.name.toLowerCase() === npcId.toLowerCase()
            );

            if (npc) {
              store.setNPCSpeaking(npc.id, dialogue, emotion);
              result = {
                success: true,
                message: `${npc.name} speaks: "${dialogue.slice(0, 50)}..."`,
                context: { npcId: npc.id, npcName: npc.name, voiceId: npc.voiceId },
              };
            } else {
              result = { success: false, message: `NPC "${npcId}" not found in scene` };
            }
            break;
          }

          case 'dismiss_npc': {
            store.removeNPC(args.npc_id);
            result = { success: true, message: `NPC dismissed` };
            break;
          }

          case 'dismiss_all_npcs': {
            store.removeAllNPCs();
            result = { success: true, message: 'All NPCs dismissed' };
            break;
          }

          case 'update_player_stats': {
            const updates: Partial<any> = {};
            if (args.health_change) {
              const current = store.playerCharacter?.stats.health || 0;
              updates.health = Math.max(0, Math.min(store.playerCharacter?.stats.maxHealth || 100, current + args.health_change));
            }
            if (args.mana_change) {
              const current = store.playerCharacter?.stats.mana || 0;
              updates.mana = Math.max(0, Math.min(store.playerCharacter?.stats.maxMana || 50, current + args.mana_change));
            }
            if (args.exp_gain) {
              const current = store.playerCharacter?.stats.experience || 0;
              updates.experience = current + args.exp_gain;
            }
            store.updatePlayerStats(updates);
            result = { success: true, message: 'Player stats updated', context: updates };
            break;
          }

          case 'give_item': {
            const item: InventoryItem = {
              id: `item_${Date.now()}`,
              name: args.item_name,
              description: args.description,
              type: args.item_type || 'misc',
              rarity: (args.rarity as ItemRarity) || 'common',
              equipped: false,
              quantity: args.quantity || 1,
              value: args.value || 0,
            };
            store.addItem(item);
            result = { success: true, message: `Received: ${item.name}`, context: { item } };
            break;
          }

          case 'give_gold': {
            store.updateGold(args.amount);
            result = { success: true, message: `Received ${args.amount} gold` };
            break;
          }

          case 'add_quest': {
            const quest: Quest = {
              id: `quest_${Date.now()}`,
              name: args.name,
              description: args.description,
              giverName: args.giver_name,
              status: 'active',
              objectives: [],
              rewards: [],
              acceptedAt: Date.now(),
            };
            store.addQuest(quest);
            result = { success: true, message: `New quest: ${quest.name}`, context: { questId: quest.id } };
            break;
          }

          case 'update_quest': {
            store.updateQuest(args.quest_id, {
              ...(args.status && { status: args.status }),
            });
            result = { success: true, message: `Quest updated` };
            break;
          }

          case 'show_choices': {
            const choices = (args.choices as any[]) || [];
            const options: DialogueOption[] = choices.map((c: any, i: number) => ({
              id: `choice_${i}`,
              text: typeof c === 'string' ? c : c.text || c.label,
              consequences: typeof c === 'string' ? undefined : c.consequences,
            }));
            store.showDialogueOptions(options, args.prompt);
            result = { success: true, message: `Showing ${options.length} choices` };
            break;
          }

          case 'log_story_event': {
            store.addStoryEvent({
              type: args.type || 'exploration',
              summary: args.summary,
              fullText: args.full_text,
              important: args.important || false,
            });
            result = { success: true, message: 'Story event logged' };
            break;
          }

          case 'roll_dice': {
            const dice = args.dice as string; // e.g. "2d6+4"
            const purpose = args.purpose as string;
            const dc = args.dc as number | undefined;

            // Parse dice notation
            const match = dice.match(/(\d+)d(\d+)(?:\+(\d+))?/);
            if (!match) {
              result = { success: false, message: `Invalid dice notation: ${dice}` };
              break;
            }
            const [, numStr, sidesStr, bonusStr] = match;
            const num = parseInt(numStr);
            const sides = parseInt(sidesStr);
            const bonus = bonusStr ? parseInt(bonusStr) : 0;

            let total = bonus;
            const rolls: number[] = [];
            for (let i = 0; i < num; i++) {
              const roll = Math.floor(Math.random() * sides) + 1;
              rolls.push(roll);
              total += roll;
            }

            const success = dc ? total >= dc : true;

            result = {
              success: true,
              message: `Rolled ${dice} for ${purpose}: ${total} (${rolls.join(', ')}${bonus ? ` +${bonus}` : ''})${dc ? ` vs DC ${dc}: ${success ? 'SUCCESS' : 'FAILURE'}` : ''}`,
              context: { total, rolls, bonus, dc, success, purpose },
            };
            break;
          }

          case 'update_relationship': {
            store.updateNPCRelationship(args.npc_id, args.change);
            result = { success: true, message: `Relationship updated by ${args.change}` };
            break;
          }

          case 'set_flag': {
            store.setFlag(args.key, args.value);
            result = { success: true, message: `Flag set: ${args.key} = ${args.value}` };
            break;
          }

          case 'check_flag': {
            const value = store.getFlag(args.key);
            result = {
              success: true,
              message: `Flag "${args.key}" = ${value ?? 'not set'}`,
              context: { key: args.key, value: value ?? null },
            };
            break;
          }

          case 'save_game': {
            store.saveGame(args.slot_name);
            result = { success: true, message: 'Game saved' };
            break;
          }

          case 'set_narration': {
            store.setNarration(args.text);
            result = { success: true, message: 'Narration set' };
            break;
          }

          case 'update_scene_background': {
            const bgPrompt = args.background_prompt as string;
            let backgroundUrl: string | undefined;
            try {
              const response = await apiClient<{ media: { url: string }[] }>('/api/voice-canvas/generate-media', {
                method: 'POST',
                body: JSON.stringify({
                  type: 'image',
                  prompt: bgPrompt,
                  style: 'fantasy_landscape',
                  forceSchnell: true,
                }),
              });
              backgroundUrl = response.media?.[0]?.url;
            } catch (e) {
              console.warn('[RPGTools] Background update failed:', e);
            }
            store.setScene({ backgroundPrompt: bgPrompt, backgroundUrl });
            result = { success: true, message: 'Scene background updated', context: { backgroundUrl } };
            break;
          }

          case 'play_sfx': {
            // TODO: implement with expo-av
            result = { success: true, message: `SFX: ${args.sfx}` };
            break;
          }

          default:
            result = { success: false, message: `Unknown RPG tool: ${name}` };
        }
      } catch (error) {
        result = {
          success: false,
          message: error instanceof Error ? error.message : 'RPG tool execution failed',
        };
      }

      return result;
    },
  };
}
