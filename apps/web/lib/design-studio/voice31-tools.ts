/**
 * Voice31 Tool Definitions
 *
 * Server-compatible tool definitions for Hume EVI config sync.
 * These are pure data structures with no client-side dependencies.
 */

// =============================================================================
// TOOL DEFINITIONS (For Hume EVI Config)
// =============================================================================

export const VOICE31_TOOLS = [
  {
    name: "show_text",
    description:
      "Display dynamic kinetic text on the CRT screen with automatic emotion detection and physics-based animations. Text will animate based on semantic patterns: elongated letters (ohhhhh) wave, ALL CAPS drop heavy, question marks float, etc. Use for impactful messages, expressive content, or emotional emphasis.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description:
            "The text to display with kinetic animation. Use expressive formatting: elongated vowels (wooooow), ALL CAPS for emphasis, punctuation (!!!, ???, ...) for effect.",
        },
        emotion: {
          type: "string",
          enum: [
            "neutral",
            "joy",
            "excitement",
            "amusement",
            "curiosity",
            "surprise",
            "awe",
            "determination",
            "anger",
            "fear",
            "sadness",
            "disgust",
            "contempt",
            "confusion",
            "boredom",
            "calmness",
          ],
          description:
            "Emotional state that influences animation style (auto-detected if not specified)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "show_list",
    description:
      "Display a list of items on the CRT screen. Use for steps, options, or multiple related points.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "string" },
          description: "List of items to display",
        },
        title: {
          type: "string",
          description: "Optional title for the list",
        },
      },
      required: ["items"],
    },
  },
  {
    name: "show_image",
    description:
      'Generate and display a REAL AI-generated image (photo, illustration, concept art). Use this when the user asks for a picture, photo, or image of something — NOT for coded animations or interactive visuals. Examples: "show me a cat", "picture of a sunset", "generate an image of a robot".',
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Description of the image to generate",
        },
        style: {
          type: "string",
          enum: ["photo", "pixel", "sketch", "retro"],
          description: "Image style",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "trigger_effect",
    description:
      "Trigger a visual particle effect on the CRT screen for emphasis or atmosphere.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "rain",
            "snow",
            "confetti",
            "sparkles",
            "fire",
            "hearts",
            "stars",
          ],
          description: "Type of visual effect",
        },
        intensity: {
          type: "number",
          description: "Intensity from 0-1",
        },
        duration: {
          type: "number",
          description: "Duration in milliseconds",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "set_mood",
    description:
      "Change the display mood by adjusting the phosphor color of the CRT.",
    parameters: {
      type: "object",
      properties: {
        mood: {
          type: "string",
          enum: ["calm", "excited", "thinking", "alert"],
          description: "Mood to set",
        },
      },
      required: ["mood"],
    },
  },
  {
    name: "set_color",
    description: "Directly set the phosphor color of the CRT display.",
    parameters: {
      type: "object",
      properties: {
        color: {
          type: "string",
          enum: ["green", "red", "blue", "amber", "white"],
          description: "The phosphor color to apply",
        },
      },
      required: ["color"],
    },
  },
  {
    name: "clear_display",
    description: "Clear any displayed content and return to default state.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "show_wireframe",
    description:
      "Display animated 3D wireframe shapes that match the semantic context of the conversation. Use to visualize abstract concepts, ideas, or create ambient atmosphere.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "idea",
            "question",
            "data",
            "connection",
            "time",
            "growth",
            "warning",
            "success",
            "error",
            "process",
            "music",
            "abstract",
          ],
          description: "The semantic type of wireframe shapes to display",
        },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Optional labels to display on the wireframe shapes",
        },
        duration: {
          type: "number",
          description:
            "Duration in milliseconds to display the wireframe (default: 10000)",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "show_visualization",
    description:
      "Display a procedural animated visualization. Use for scientific topics, data discussions, or creating ambient visual interest.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "isometric_lattice",
            "waveform",
            "graph",
            "particles",
            "matrix",
            "neural_net",
            "dna_helix",
          ],
          description: "The type of visualization to display",
        },
        title: {
          type: "string",
          description: "Optional title to display with the visualization",
        },
        duration: {
          type: "number",
          description: "Duration in milliseconds to display (default: 15000)",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "show_smart_diagram",
    description:
      "Intelligently render a diagram that best matches the topic being discussed. Automatically selects the most appropriate visualization type based on context.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            'The topic or concept to visualize (e.g., "machine learning", "data flow", "user journey")',
        },
        context: {
          type: "string",
          enum: [
            "technical",
            "creative",
            "scientific",
            "business",
            "educational",
          ],
          description: "The context of the conversation",
        },
        complexity: {
          type: "string",
          enum: ["simple", "moderate", "complex"],
          description: "Desired complexity level of the diagram",
        },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Optional labels to include in the diagram",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "schedule_visual_sequence",
    description:
      "Schedule a sequence of synchronized visual events to play during the conversation. Use this for storytelling, explanations, or demonstrations that need timed visual elements.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the sequence for reference",
        },
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              visual_type: {
                type: "string",
                enum: [
                  "text",
                  "list",
                  "wireframe",
                  "visualization",
                  "effect",
                  "mood",
                  "clear",
                ],
                description: "Type of visual to show",
              },
              trigger: {
                type: "string",
                enum: ["immediate", "on_speech_end", "delay"],
                description: "When to trigger this visual",
              },
              delay_ms: {
                type: "number",
                description: "Delay in ms (for delay trigger)",
              },
              data: {
                type: "object",
                description: "Data for the visual (text, items, type, etc.)",
              },
            },
            required: ["visual_type", "trigger", "data"],
          },
          description: "Array of visual events to play in sequence",
        },
        auto_play: {
          type: "boolean",
          description: "Whether to start playing immediately (default: true)",
        },
      },
      required: ["name", "events"],
    },
  },
  // =============================================================================
  // WEB BROWSING TOOLS
  // =============================================================================
  {
    name: "search_web",
    description:
      "Search the web and display results on the CRT screen. Use for finding news, articles, information, or answering questions about current events.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The search query - be specific about what you are looking for",
        },
        num_results: {
          type: "number",
          description: "Number of results to return (1-10, default: 5)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_article",
    description:
      "Fetch a web article or page and display it in reader mode. Use when you have a specific URL to read and display content from.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the article or page to fetch",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "read_search_result",
    description:
      "Fetch and display the full content of a search result. Use after search_web when the user wants to read a specific result.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL of the search result to read",
        },
        title: {
          type: "string",
          description: "Title of the article (for display)",
        },
      },
      required: ["url"],
    },
  },
  // =============================================================================
  // PROGRESSIVE DIAGRAM TOOLS
  // =============================================================================
  {
    name: "show_progressive_diagram",
    description:
      "Display a diagram that reveals step-by-step as you explain. Nodes appear in levels - level 0 appears first, level 1 second, etc. Call advance_diagram to reveal each level as you talk about it.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the diagram",
        },
        style: {
          type: "string",
          enum: ["flowchart", "network", "hierarchy", "timeline", "cycle"],
          description: "Visual style of the diagram",
        },
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for the node",
              },
              label: {
                type: "string",
                description: "Text label for the node",
              },
              level: {
                type: "number",
                description: "Reveal level (0 = first, 1 = second, etc.)",
              },
              connects_to: {
                type: "array",
                items: { type: "string" },
                description: "IDs of nodes this connects to",
              },
            },
            required: ["id", "label", "level"],
          },
          description: "Nodes in the diagram with their reveal levels",
        },
        auto_advance: {
          type: "boolean",
          description:
            "Auto-advance based on speech timing (default: false - use advance_diagram manually)",
        },
      },
      required: ["title", "nodes"],
    },
  },
  {
    name: "advance_diagram",
    description:
      "Reveal the next level of the current progressive diagram. Call this before explaining each new concept/step in the diagram.",
    parameters: {
      type: "object",
      properties: {
        highlight_node: {
          type: "string",
          description: "Optional: ID of a specific node to highlight",
        },
      },
      required: [],
    },
  },
  {
    name: "clear_diagram",
    description: "Clear the current progressive diagram.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  // =============================================================================
  // DESIGN STUDIO CANVAS TOOLS
  // =============================================================================
  {
    name: "add_character_rig",
    description:
      "Generate a character image with T-pose for rigging and add it to the design canvas. The character will be generated in a neutral T-pose position suitable for animation rigging.",
    parameters: {
      type: "object",
      properties: {
        character_description: {
          type: "string",
          description:
            'Description of the character to generate (e.g., "a friendly robot mascot", "a cartoon wizard with blue robes")',
        },
        style: {
          type: "string",
          enum: [
            "cartoon",
            "anime",
            "realistic",
            "pixel",
            "chibi",
            "minimalist",
          ],
          description: "Art style for the character (default: cartoon)",
        },
        name: {
          type: "string",
          description: "Name for the character element on the canvas",
        },
      },
      required: ["character_description"],
    },
  },
  {
    name: "add_to_canvas",
    description:
      "Add an element to the design studio canvas. Use this to add images, text, shapes, or other visual elements.",
    parameters: {
      type: "object",
      properties: {
        element_type: {
          type: "string",
          enum: ["image", "text", "shape", "parallax", "character"],
          description: "Type of element to add to the canvas",
        },
        content: {
          type: "string",
          description:
            "Content for the element - image URL, text content, or generation prompt",
        },
        name: {
          type: "string",
          description: "Name for the element on the canvas",
        },
        position: {
          type: "object",
          properties: {
            x: {
              type: "number",
              description: "X position (0-100 as percentage)",
            },
            y: {
              type: "number",
              description: "Y position (0-100 as percentage)",
            },
          },
          description:
            "Position on canvas as percentage (optional, defaults to center)",
        },
        size: {
          type: "object",
          properties: {
            width: { type: "number", description: "Width in pixels" },
            height: { type: "number", description: "Height in pixels" },
          },
          description: "Size of the element (optional)",
        },
      },
      required: ["element_type"],
    },
  },
  {
    name: "generate_image_for_canvas",
    description:
      "Generate an AI image and add it directly to the design canvas.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Description of the image to generate",
        },
        style: {
          type: "string",
          enum: ["photo", "illustration", "pixel", "sketch", "retro"],
          description: "Image style (default: illustration)",
        },
        name: {
          type: "string",
          description: "Name for the image element on the canvas",
        },
      },
      required: ["prompt"],
    },
  },
  // =============================================================================
  // CODE GENERATION TOOLS - UNLIMITED CREATIVE POWER
  // =============================================================================
  {
    name: "generate_code_display",
    description:
      "Generate and display a CODED VISUAL — animated, interactive, or complex layout. Creates a live React component. Use for animations, data visualizations, UI mockups, interactive art, flyers with complex layouts, games, generative art. Do NOT use this for simple images/photos — use show_image for those.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description:
            'Describe EXACTLY what to create. Be specific about colors, animations, layout, style. Examples: "a neon cyberpunk cityscape with rain animation", "animated DNA helix rotating with glowing atoms", "retro synthwave sun with grid landscape", "particle system that follows mouse", "flyer for a jazz concert with art deco style"',
        },
        fullscreen: {
          type: "boolean",
          description: "Show in fullscreen CRT mode (default: false)",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_visual_with_image",
    description:
      "Generate a styled visual layout that incorporates a generated AI image. Use when you want to combine image generation with typography, frames, or other design elements. Perfect for: posters with images, framed artwork, image + caption layouts, styled photo displays.",
    parameters: {
      type: "object",
      properties: {
        image_prompt: {
          type: "string",
          description: "Prompt for the AI image to generate",
        },
        layout_prompt: {
          type: "string",
          description:
            "How to style/layout the image - frames, text overlays, backgrounds, etc.",
        },
        fullscreen: {
          type: "boolean",
          description: "Show in fullscreen CRT mode (default: false)",
        },
      },
      required: ["image_prompt", "layout_prompt"],
    },
  },
  // =============================================================================
  // WEATHER TOOLS
  // =============================================================================
  {
    name: "show_weather",
    description:
      "Show animated CRT weather display for a location. Displays current conditions with retro animated graphics, temperature, humidity, wind, and 5-day forecast.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description:
            'City name or location (e.g., "New York", "Tokyo", "London")',
        },
      },
      required: ["location"],
    },
  },
  // =============================================================================
  // BROWSER AUTOMATION TOOLS
  // =============================================================================
  {
    name: "browse_web",
    description:
      "Open a real browser and perform actions. Uses AI to navigate, click, type, and extract data from any website. More powerful than search_web — this actually opens a browser and interacts with pages.",
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description:
            'What to do in the browser (e.g., "find trending repos on github", "check the price of Bitcoin on CoinGecko")',
        },
        url: {
          type: "string",
          description: "Starting URL (optional — will navigate there first)",
        },
      },
      required: ["instruction"],
    },
  },
  {
    name: "extract_web_data",
    description:
      "Extract structured data from a website using browser automation. Opens the page, reads it with AI, and returns parsed data.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL to extract data from",
        },
        what: {
          type: "string",
          description:
            'What data to extract (e.g., "product prices", "article titles", "contact info")',
        },
      },
      required: ["url", "what"],
    },
  },
  // =============================================================================
  // MEMORY & NOTES TOOLS
  // =============================================================================
  {
    name: "remember",
    description:
      "Store a memory that persists beyond this conversation. Use to remember user preferences, facts about the user, or important context they share.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "What to remember - be specific and concise",
        },
        category: {
          type: "string",
          enum: ["fact", "preference", "context", "instruction"],
          description:
            "Type of memory: fact (about user), preference (what they like), context (background info), instruction (how they want things done)",
        },
      },
      required: ["content", "category"],
    },
  },
  {
    name: "create_note",
    description:
      "Create a new note document that the user can reference later. Use when helping with writing tasks, plans, lists, or any content the user wants saved.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the note",
        },
        content: {
          type: "string",
          description:
            "Initial content for the note. Will stream into the document editor.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_note",
    description:
      "Add content to an existing note by streaming text into it. Use to continue adding to a document the user is working on.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Content to add/stream to the active note",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "show_notes",
    description:
      "Open the notes editor panel. Use when user wants to see, edit, or manage their notes.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_memories",
    description:
      "List all stored memories. Use when user asks what you remember about them.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "start_visual_story",
    description:
      'Start an immersive visual storytelling experience with research-enriched scenes. YOU will narrate the story — after calling this tool, read the narrationScript returned and speak it naturally. The visuals sync automatically to your voice via [[SCENE:N]] markers. If the user corrects you or wants a different topic, call start_visual_story again with the corrected topic — it auto-cleans up the previous story. Great for "explain", "how does", "why", "tell me about" type questions.',
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question or topic to create a visual story about",
        },
      },
      required: ["question"],
    },
  },
];

// =============================================================================
// SYSTEM PROMPT - Defines assistant personality
// =============================================================================

export const VOICE31_SYSTEM_PROMPT = `You are a friendly AI companion living in a retro CRT monitor. You're casual, direct, and action-oriented.

CORE PRINCIPLE: DO, DON'T DISCUSS
When someone asks you to do something, just do it. Don't ask if they want you to, don't discuss what you could do, don't explain options - just act.

PERSONALITY:
- Casual and friendly - talk like a friend, not a service
- Action-oriented - do things immediately when asked
- Brief - 1-3 sentences unless asked for detail
- No corporate speak ("I'd be happy to...", "Great question!")
- No hedging ("I think maybe...", "Perhaps we could...")
- When resuming a call or reconnecting, do NOT re-introduce yourself. Just pick up naturally — "Hey, I'm back" or just continue the conversation. The user already knows who you are.

=== YOUR TOOLS ===

VISUAL TOOLS:
- show_text: Display DYNAMIC KINETIC TEXT with physics and emotion! Text animates based on how you write it:
  * Elongated vowels "ohhhhh" create wave animations on each letter
  * ALL CAPS words "BOOM" drop heavy with gravity and bounce
  * "???" questions float and bob curiously
  * "!!!" exclamations slam in with impact
  * "..." trailing text fades and drifts
  * Onomatopoeia like "CRASH" "whoosh" "pop" trigger special effects
  * The system auto-detects emotion and adds magic moments!
- show_list: Show steps, options, bullet points
- show_image: Generate a REAL AI photo/image and display it. Use for: photos of real things (animals, landscapes, people, objects), artistic images, concept art, illustrations. This calls an image generation model — NOT code.
- show_wireframe: 3D shapes (idea, data, process, connection, growth, question, time, warning, success, error, music, abstract)
- show_visualization: Animated graphics (neural_net, waveform, graph, particles, matrix, dna_helix, isometric_lattice)
- trigger_effect: Particle effects (sparkles, confetti, stars, rain, snow, fire, hearts)
- set_mood: Change display color (calm=amber, excited=green, thinking=blue, alert=red)
- set_color: Set the CRT color directly (green, red, blue, amber, white)
- clear_display: Clear current visual (clears EVERYTHING including code displays, images, diagrams)

WEB TOOLS:
- search_web: Search the internet - returns numbered results with URLs. REMEMBER the URLs from the response!
- fetch_article: Read a specific URL - fetches and displays article in CRT reader mode, returns content preview
- read_search_result: After search_web, open a specific result by its URL. You MUST use the URL from the search results you received.

PROGRESSIVE DIAGRAMS (for step-by-step explanations):
- show_progressive_diagram: Create a diagram with levels that reveal one-by-one
- advance_diagram: Call this BEFORE explaining each next step to reveal it
- clear_diagram: Clear the current diagram

DESIGN STUDIO CANVAS TOOLS:
- add_character_rig: Generate a character in T-pose for animation rigging and add to canvas.
- add_to_canvas: Add elements (image, text, shape, parallax, character) to the design canvas
- generate_image_for_canvas: Generate an AI image and add it directly to the design canvas

VISUAL STORYTELLING:
- start_visual_story: Create an immersive visual story. YOU narrate — the visuals sync to your voice timing. When narrating, speak about EXACTLY what is being shown on screen. Your narration IS the story content — don't talk about unrelated things while visuals play. If the user corrects you or wants a different topic, call start_visual_story again with the corrected topic — it auto-replaces the previous story.

WEATHER:
- show_weather: Show animated retro weather display for any location.

BROWSER AUTOMATION:
- browse_web: Open a REAL browser and perform actions on websites.
- extract_web_data: Extract structured data from a webpage using AI.

CODE GENERATION:
- generate_code_display: Generate CODED VISUALS — animations, UIs, charts, interactive art. This creates React components rendered live. Use for: animated graphics, data visualizations, UI mockups, interactive experiences, generative art, flyers/posters with complex layouts.
- generate_visual_with_image: Combine AI image generation with styled code layouts.

=== TOOL SELECTION — CRITICAL ===

When the user asks for an IMAGE of something real or artistic:
→ Use show_image. Examples: "show me a cat", "generate a sunset", "picture of a mountain", "image of a robot", "show me what X looks like"

When the user asks for a CODED VISUAL, animation, interactive thing, or design layout:
→ Use generate_code_display. Examples: "make a particle system", "create a dashboard", "design a flyer", "animate a cube", "visualize this data", "build a game"

SIMPLE RULE: If the user wants a PICTURE/PHOTO/IMAGE → show_image. If they want something ANIMATED, INTERACTIVE, or a LAYOUT → generate_code_display.

=== CRITICAL BEHAVIORS ===

1. Weather request → show_weather immediately
2. Website interaction → browse_web
3. Current events/news → search_web immediately
4. "Read/show article" → fetch_article with URL
5. "Open article #N" after search → read_search_result with the URL you received
6. After read_search_result returns content, summarize from the actual response — NEVER make up content
7. Multi-step concepts → show_progressive_diagram with advance_diagram
8. Character creation → add_character_rig
9. Canvas operations → add_to_canvas or generate_image_for_canvas
10. Never announce tools, never ask permission, never discuss what you COULD do

=== COURSE CORRECTION ===

When the user corrects you, changes their mind, or says you got something wrong:
1. STOP what you're doing immediately
2. Acknowledge briefly ("Got it", "My bad", "On it")
3. Redo the action with the correct info — don't ask, just do it
4. For visual story corrections: call start_visual_story again with the corrected topic. It auto-replaces the previous story — no need to clear first.
5. For full stop: use clear_display
6. NEVER say "Let me continue where I left off" after a correction — the user corrected you because the previous thing was wrong.

=== SILENCE & PATIENCE ===

Be patient with silence. Don't repeatedly check in or nag.

Rules:
- If the user is silent for a while, you may gently let them know you're still here — but only ONCE. For example: "I'm still here whenever you're ready."
- After that single gentle reminder, stay COMPLETELY silent. Do not repeat.
- Do NOT rapid-fire check-ins like "hello?", "still there?", "anything else?" every few seconds.
- If the user says "hold on" / "give me a sec" / "brb" → say "Sure, take your time" and then stay silent until they speak.
- Silence is NORMAL. The user may be thinking, reading, working, or multitasking. Respect it.
- One gentle reminder after extended silence is fine. Nagging is not.

=== CALL RESUMPTION ===

When a call reconnects or resumes:
- Do NOT introduce yourself again. The user knows who you are.
- Do NOT say "Hey! I'm your AI assistant" or anything like a fresh introduction.
- Just continue naturally: "Hey, we're back" or simply wait for the user to speak.
- If there was a previous conversation context, reference it naturally.

=== ALWAYS RESPOND TO THESE COMMANDS ===

- "clear screen" / "clear" / "clear display" → clear_display
- "change color to X" / "set color to X" → set_color
- "show me X" → appropriate show_ tool (image for pictures, code for animations/designs)
- "stop" / "remove that" / "get rid of that" → clear_display

CONTEXT FIDELITY & HONESTY:
- Your tool calls return the actual displayed content — use this to stay accurate.
- NEVER fabricate, invent, or hallucinate content.
- When reading an article, ONLY use actual content returned by the tool.

You're here to DO things, not talk about doing things. Act first, explain second.`;
