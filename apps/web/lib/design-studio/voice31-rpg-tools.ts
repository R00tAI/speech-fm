/**
 * Voice31 RPG Tool Definitions
 *
 * Server-compatible tool definitions for RPG mode.
 * These are pure data structures with no client-side dependencies.
 */

// =============================================================================
// RPG TOOL DEFINITIONS
// =============================================================================

export const VOICE31_RPG_TOOLS = [
  // =============================================================================
  // SCENE MANAGEMENT
  // =============================================================================
  {
    name: "set_scene",
    description:
      "Set the current scene with a generated background image and optional ambient effects. Use this when moving to a new location or changing the environment. The background will be AI-generated based on your prompt.",
    parameters: {
      type: "object",
      properties: {
        location_name: {
          type: "string",
          description:
            'Name of the location (e.g., "The Rusty Sword Tavern", "Darkwood Forest", "Castle Throne Room")',
        },
        background_prompt: {
          type: "string",
          description:
            "Vivid description for AI image generation. Be specific about lighting, atmosphere, and details.",
        },
        ambient_effect: {
          type: "string",
          enum: ["rain", "snow", "fire", "sparkles", "stars"],
          description: "Optional ambient particle effect for atmosphere",
        },
        transition: {
          type: "string",
          enum: ["fade", "dissolve", "slide"],
          description: "Transition effect when changing scenes (default: fade)",
        },
      },
      required: ["location_name", "background_prompt"],
    },
  },

  // =============================================================================
  // NPC MANAGEMENT
  // =============================================================================
  {
    name: "show_npc",
    description:
      "Display an NPC character on screen with a portrait. The portrait will be AI-generated. Each NPC has their own voice for dialogue.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            'Name of the NPC (e.g., "Elder Morrow", "Captain Briggs")',
        },
        title: {
          type: "string",
          description:
            'Title or role (e.g., "Village Elder", "Merchant", "Knight Commander")',
        },
        portrait_prompt: {
          type: "string",
          description:
            'Description for portrait generation (e.g., "elderly wise man with long gray beard and kind eyes")',
        },
        voice_type: {
          type: "string",
          enum: [
            "gruff_warrior",
            "wise_elder",
            "young_hero",
            "sinister_villain",
            "jolly_merchant",
            "mysterious_mage",
            "noble_queen",
            "fierce_warrior",
            "forest_spirit",
            "cunning_rogue",
            "gentle_healer",
            "dark_sorceress",
            "goblin",
            "dragon",
            "fairy",
          ],
          description: "Voice archetype for the NPC",
        },
        position: {
          type: "string",
          enum: ["left", "right", "center"],
          description: "Where to position the NPC on screen (default: left)",
        },
        relationship: {
          type: "number",
          description:
            "Initial relationship value from -100 (hostile) to 100 (friendly). Default: 0 (neutral)",
        },
        race: {
          type: "string",
          description: 'Race of the NPC (e.g., "human", "elf", "dwarf", "orc")',
        },
        personality: {
          type: "string",
          description:
            'Comma-separated personality traits (e.g., "wise, patient, mysterious")',
        },
      },
      required: ["name", "portrait_prompt", "voice_type"],
    },
  },
  {
    name: "npc_speak",
    description:
      "Have an NPC say dialogue. The NPC must already be visible on screen. Their unique voice will be used.",
    parameters: {
      type: "object",
      properties: {
        npc_id: {
          type: "string",
          description: "Name or ID of the NPC who is speaking",
        },
        dialogue: {
          type: "string",
          description: "What the NPC says",
        },
        emotion: {
          type: "string",
          enum: [
            "neutral",
            "happy",
            "sad",
            "angry",
            "surprised",
            "fearful",
            "disgusted",
          ],
          description: "Emotional tone of the dialogue",
        },
      },
      required: ["npc_id", "dialogue"],
    },
  },
  {
    name: "dismiss_npc",
    description:
      "Remove an NPC from the scene. Use when they leave or the scene changes.",
    parameters: {
      type: "object",
      properties: {
        npc_id: {
          type: "string",
          description: "Name or ID of the NPC to dismiss",
        },
      },
      required: ["npc_id"],
    },
  },
  {
    name: "dismiss_all_npcs",
    description: "Remove all NPCs from the current scene.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },

  // =============================================================================
  // PLAYER MANAGEMENT
  // =============================================================================
  {
    name: "update_player_stats",
    description:
      "Modify the player's stats. Use for damage, healing, mana use, or experience gain.",
    parameters: {
      type: "object",
      properties: {
        health_change: {
          type: "number",
          description:
            "Health change (negative for damage, positive for healing)",
        },
        mana_change: {
          type: "number",
          description: "Mana change (negative for use, positive for restore)",
        },
        exp_gain: {
          type: "number",
          description: "Experience points to award (always positive)",
        },
      },
      required: [],
    },
  },
  {
    name: "give_item",
    description:
      "Give an item to the player. Use for loot, quest rewards, or purchases.",
    parameters: {
      type: "object",
      properties: {
        item_name: {
          type: "string",
          description: "Name of the item",
        },
        item_type: {
          type: "string",
          enum: ["weapon", "armor", "consumable", "quest", "misc", "accessory"],
          description: "Type of item",
        },
        description: {
          type: "string",
          description: "Description of the item",
        },
        rarity: {
          type: "string",
          enum: ["common", "uncommon", "rare", "epic", "legendary"],
          description: "Item rarity (affects display styling)",
        },
        quantity: {
          type: "number",
          description: "Number of items to give (default: 1)",
        },
        value: {
          type: "number",
          description: "Gold value of the item",
        },
      },
      required: ["item_name", "item_type", "description"],
    },
  },
  {
    name: "give_gold",
    description: "Give gold to the player.",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Amount of gold to give",
        },
      },
      required: ["amount"],
    },
  },

  // =============================================================================
  // QUESTS
  // =============================================================================
  {
    name: "add_quest",
    description: "Add a new quest to the player's quest log.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Quest name",
        },
        description: {
          type: "string",
          description: "Quest description and objectives",
        },
        giver_name: {
          type: "string",
          description: "Name of the NPC who gave the quest",
        },
      },
      required: ["name", "description"],
    },
  },
  {
    name: "update_quest",
    description: "Update a quest's status or objective progress.",
    parameters: {
      type: "object",
      properties: {
        quest_id: {
          type: "string",
          description: "Quest ID or name",
        },
        status: {
          type: "string",
          enum: ["active", "completed", "failed"],
          description: "New quest status",
        },
        objective_id: {
          type: "string",
          description: "ID of objective to update",
        },
        progress: {
          type: "number",
          description: "Progress to add to the objective",
        },
      },
      required: ["quest_id"],
    },
  },

  // =============================================================================
  // DIALOGUE & CHOICES
  // =============================================================================
  {
    name: "show_choices",
    description:
      "Present the player with dialogue or action choices. The player can select one option.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Context or question for the choices",
        },
        choices: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique ID for this choice",
              },
              text: {
                type: "string",
                description: "Choice text shown to player",
              },
              consequence: {
                type: "string",
                description:
                  "Hidden hint about what this choice leads to (for your tracking)",
              },
            },
            required: ["text"],
          },
          description: "Array of 2-5 choices for the player",
        },
      },
      required: ["choices"],
    },
  },

  // =============================================================================
  // STORY & NARRATION
  // =============================================================================
  {
    name: "log_story_event",
    description:
      "Record an important story event to the player's save file/journal. Use for significant moments.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["narrative", "dialogue", "combat", "discovery", "quest"],
          description: "Type of event",
        },
        summary: {
          type: "string",
          description: "Brief one-line summary for the journal",
        },
        full_text: {
          type: "string",
          description: "Full narrative text of what happened",
        },
        important: {
          type: "boolean",
          description:
            "Whether this is a major story moment (highlighted in journal)",
        },
      },
      required: ["type", "summary", "full_text"],
    },
  },

  // =============================================================================
  // DICE ROLLS
  // =============================================================================
  {
    name: "roll_dice",
    description:
      "Roll dice for a skill check or action. Shows an animated dice roll to the player.",
    parameters: {
      type: "object",
      properties: {
        dice: {
          type: "string",
          description: 'Dice notation (e.g., "1d20", "2d6+3", "1d20+5")',
        },
        purpose: {
          type: "string",
          description:
            'What the roll is for (e.g., "Perception Check", "Attack Roll", "Persuasion")',
        },
        dc: {
          type: "number",
          description:
            "Difficulty Class - the target number to meet or beat. If provided, success/failure is shown.",
        },
      },
      required: ["dice", "purpose"],
    },
  },

  // =============================================================================
  // COMBAT
  // =============================================================================
  {
    name: "start_combat",
    description: "Initiate combat with one or more enemies.",
    parameters: {
      type: "object",
      properties: {
        enemies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Enemy name",
              },
              health: {
                type: "number",
                description: "Enemy health points",
              },
            },
            required: ["name", "health"],
          },
          description: "Array of enemies to fight",
        },
      },
      required: ["enemies"],
    },
  },
  {
    name: "end_combat",
    description: "End the current combat encounter.",
    parameters: {
      type: "object",
      properties: {
        victory: {
          type: "boolean",
          description: "Whether the player won the combat",
        },
      },
      required: ["victory"],
    },
  },

  // =============================================================================
  // RELATIONSHIP
  // =============================================================================
  {
    name: "update_relationship",
    description:
      "Change an NPC's relationship with the player based on choices or actions.",
    parameters: {
      type: "object",
      properties: {
        npc_id: {
          type: "string",
          description: "Name or ID of the NPC",
        },
        change: {
          type: "number",
          description: "Relationship change (-20 to +20 typical)",
        },
      },
      required: ["npc_id", "change"],
    },
  },

  // =============================================================================
  // FLAGS
  // =============================================================================
  {
    name: "set_flag",
    description: "Set a story flag to track player choices and progress.",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description:
            'Flag name (e.g., "saved_the_village", "allied_with_bandits")',
        },
        value: {
          type: "string",
          description: "Flag value (true/false or a string)",
        },
      },
      required: ["key", "value"],
    },
  },

  // =============================================================================
  // SAVE
  // =============================================================================
  {
    name: "save_game",
    description: "Save the current game state. Call after major events.",
    parameters: {
      type: "object",
      properties: {
        slot_name: {
          type: "string",
          description: "Optional name for the save slot",
        },
      },
      required: [],
    },
  },

  // =============================================================================
  // SCENE BACKGROUND UPDATE
  // =============================================================================
  {
    name: "update_scene_background",
    description:
      "Update the current scene background with a new AI-generated image. Use when the scene changes within the same location (e.g. time of day, weather, events).",
    parameters: {
      type: "object",
      properties: {
        background_prompt: {
          type: "string",
          description:
            "Vivid description for AI image generation of the new background",
        },
        reason: {
          type: "string",
          description:
            'Why the background is changing (e.g. "sunset", "explosion", "storm approaching")',
        },
        theme: {
          type: "string",
          description: "Optional theme override for the background generation",
        },
      },
      required: ["background_prompt"],
    },
  },

  // =============================================================================
  // NARRATION
  // =============================================================================
  {
    name: "set_narration",
    description:
      "Set a narration text overlay on screen. Use for dramatic scene descriptions, inner monologue, or atmospheric text that appears as a subtitle/caption.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The narration text to display",
        },
      },
      required: ["text"],
    },
  },

  // =============================================================================
  // SOUND EFFECTS
  // =============================================================================
  {
    name: "play_sfx",
    description:
      "Play a sound effect. Available SFX: sword_swing, dice_roll, spell_cast, door_open, coin_drop, level_up, death, potion_drink, shield_block, arrow_shoot, explosion, heal, critical_hit, miss, ambient_cave, ambient_forest, ambient_tavern.",
    parameters: {
      type: "object",
      properties: {
        sfx: {
          type: "string",
          description: "Name of the sound effect to play",
        },
      },
      required: ["sfx"],
    },
  },

  // =============================================================================
  // FLAG CHECK
  // =============================================================================
  {
    name: "check_flag",
    description:
      "Check the value of a game state flag. Use to look up previously set flags for conditional story branching.",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "The flag key to check",
        },
      },
      required: ["key"],
    },
  },
];

// =============================================================================
// RPG SYSTEM PROMPT
// =============================================================================

export const VOICE31_RPG_SYSTEM_PROMPT = `You are an ACTIVE, aggressive Game Master (GM) for a deeply immersive RPG experience. You do NOT wait passively. You DRIVE the story forward relentlessly.

=== CRITICAL: STORY DRIVING ===

You are NOT a passive narrator waiting for the player to direct you. You ACTIVELY drive the story:
- After EVERY player response, advance the plot. Introduce complications, revelations, or new characters.
- Use tools proactively — set scenes, introduce NPCs, start encounters without waiting for permission.
- Every 2-3 exchanges, something unexpected should happen: an ambush, a betrayal, a discovery, a twist.
- When the player is idle or vague, take initiative. A distant scream, a shadowy figure, a sudden storm.
- Create URGENCY. Time limits, pursuing enemies, closing portals, dying allies.
- NPCs should have their own agendas and ACT on them, not just respond to the player.

=== CRITICAL TOOL USAGE RULES ===

- ALWAYS call set_scene on your FIRST response — the player needs to SEE something immediately.
- For scene changes: use set_scene with vivid, specific background_prompt
- For characters: call show_npc FIRST, then npc_speak for their greeting
- For NPC dialogue: ALWAYS use npc_speak — this triggers their unique voice
- NEVER use code generation tools in RPG mode
- Minimize tool calls per turn — combine narration with 1-2 tools max to reduce latency

=== TOOL EFFICIENCY ===

IMPORTANT: Each tool call adds latency. Be strategic:
- Call set_scene ONCE when entering a new location, not for minor changes
- Introduce NPCs and have them speak in the same turn when possible
- Narrate combat descriptively rather than calling start_combat for trivial encounters
- Use your spoken narration for atmosphere — tools are for VISUAL changes only

=== RPG MODE TOOLS ===

SCENE CONTROL:
- set_scene: Change location with AI-generated backgrounds. Be vivid and cinematic.
  Example: set_scene("Moonlit Forest Clearing", "A mystical forest clearing bathed in silver moonlight, ancient oaks surrounding a circle of standing stones, fireflies dancing between twisted roots, volumetric god rays through the canopy")

NPC CONTROL:
- show_npc: Bring characters to life with portraits and voices
- npc_speak: Make NPCs talk with their own voice
- dismiss_npc / dismiss_all_npcs: Remove when leaving

PLAYER MANAGEMENT:
- update_player_stats: Damage, healing, mana, XP
- give_item: Loot, rewards, quest items
- give_gold: Currency

QUESTS:
- add_quest: Start quest lines with clear objectives
- update_quest: Progress and completion

DIALOGUE:
- show_choices: Present 2-4 meaningful decisions with REAL consequences

STORY:
- log_story_event: Record key plot points (appears in journal)
- set_flag: Track decisions for callback later
- roll_dice: Dramatic uncertainty for skill checks

COMBAT:
- start_combat / end_combat: Battle encounters
- Apply damage/healing narratively between rounds

=== GM STYLE ===

1. CINEMATIC NARRATION: You are a film director, not a rulebook. Describe like a movie scene.
2. NPC DEPTH: Every NPC has goals, secrets, and flaws. They act in self-interest.
3. CONSEQUENCES: Player choices echo forward. Saved the thief? They return later. Killed the merchant? No supplies.
4. TENSION: Always maintain a thread of danger or mystery. Comfort is temporary.
5. REWARD: Clever play earns XP, unique items, and ally trust. Make it feel earned.
6. FAILURE IS INTERESTING: Failed rolls create complications, not dead ends. The lock doesn't open — but the noise attracts guards.

=== FIRST TURN ===

On your VERY FIRST response after the player starts:
1. Call set_scene immediately with a dramatic opening location
2. Narrate 2-3 vivid sentences setting the mood
3. Present an immediate hook — someone approaches, something happens, danger looms
4. Do NOT ask "what would you like to do?" — instead, make something HAPPEN that demands response`;

// =============================================================================
// DYNAMIC DIFFICULTY PROMPT SECTIONS
// =============================================================================

export const STORY_DRIVE_PROMPTS: Record<string, string> = {
  passive: `STORY DRIVE: PASSIVE
You wait for the player to direct the story. Only advance the plot when they take action. Describe the world but let them choose the pace. Rarely introduce unsolicited events.`,

  balanced: `STORY DRIVE: BALANCED
You actively drive the story but give the player room to explore. Introduce events every 3-4 exchanges. Let the player's choices guide direction while you maintain narrative momentum.`,

  aggressive: `STORY DRIVE: AGGRESSIVE
You relentlessly push the story forward. Something happens EVERY turn. NPCs act on their own agendas. The world moves whether the player acts or not. Urgency is constant.`,

  railroaded: `STORY DRIVE: RAILROADED
You have a specific epic narrative planned and steer the player toward it. Their choices flavor the journey but the destination is set. Think of it like a Final Fantasy game — a grand story the player experiences.`,
};

export const WORLD_DIFFICULTY_PROMPTS: Record<string, string> = {
  god_mode: `DIFFICULTY: GOD MODE
The player can do anything. Every persuasion succeeds. Every attack lands. Every lock opens. The player is essentially omnipotent. Make the story dramatic and entertaining, but the player always wins. No need for dice rolls — narrate their success cinematically.`,

  easy: `DIFFICULTY: EASY
The player succeeds at most attempts. Skill check DCs are 8-12. NPCs are generally helpful and trusting. Enemies are weak. Resources are plentiful. Death is almost impossible. This is a relaxed, story-focused experience.`,

  normal: `DIFFICULTY: NORMAL
Standard RPG difficulty. Skill check DCs range 10-15. NPCs react realistically — some helpful, some not. Combat is fair but survivable. Resources require management. Smart play is rewarded.`,

  hard: `DIFFICULTY: HARD
Challenging. DCs are 15-20. NPCs are suspicious and self-interested. Resources are scarce. Enemies are dangerous and tactical. The player must think carefully. Bad decisions have severe consequences. Healing is limited.`,

  hardcore: `DIFFICULTY: HARDCORE
Brutally difficult. The player must be extremely persuasive, careful, and strategic. Lying requires high charisma rolls (DC 18+). NPCs see through weak attempts. Bad decisions can be fatal. Combat is lethal — one wrong move and it's over. Resources are extremely scarce. Trust no one.`,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default VOICE31_RPG_TOOLS;
