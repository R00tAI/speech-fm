/**
 * RPG Art Style Presets System
 *
 * Comprehensive library of visual art styles for consistent image generation
 * across characters, scenes, items, and environments.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export interface ArtStylePreset {
  id: string;
  name: string;
  category: ArtStyleCategory;
  description: string;
  previewPromptSuffix: string; // Added to all prompts for this style
  colorPalette: ColorPalette;
  characteristics: string[];
  bestFor: string[]; // What genres/themes this works well with
  avoidFor?: string[]; // What it doesn't work well with
  examplePrompt: string; // Example prompt snippet
}

export type ArtStyleCategory =
  | 'illustrated'
  | 'photorealistic'
  | 'stylized'
  | 'retro'
  | 'experimental'
  | 'cultural';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  mood: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' | 'dark' | 'ethereal';
}

// =============================================================================
// ART STYLE PRESETS LIBRARY
// =============================================================================

export const ART_STYLE_PRESETS: ArtStylePreset[] = [
  // --- ILLUSTRATED STYLES ---
  {
    id: 'cel-shaded',
    name: 'Cel-Shaded',
    category: 'illustrated',
    description: 'Bold outlines with flat color shading, reminiscent of anime and modern video games',
    previewPromptSuffix: 'cel-shaded art style, bold black outlines, flat colors with sharp shadows, anime-inspired, clean vector look, vibrant palette',
    colorPalette: {
      primary: '#4F46E5',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: '#1F2937',
      mood: 'vibrant',
    },
    characteristics: ['Bold outlines', 'Flat shading', 'High contrast', 'Clean edges'],
    bestFor: ['Fantasy', 'Action', 'Comedy', 'Anime-inspired'],
    examplePrompt: 'a warrior in armor, cel-shaded style, bold black outlines, flat color shading',
  },
  {
    id: 'comic-book',
    name: 'Comic Book',
    category: 'illustrated',
    description: 'Classic American comic book style with dynamic poses and halftone effects',
    previewPromptSuffix: 'comic book art style, dynamic composition, halftone dots, bold ink lines, dramatic lighting, superhero aesthetic, Ben-Day dots',
    colorPalette: {
      primary: '#DC2626',
      secondary: '#2563EB',
      accent: '#FBBF24',
      background: '#1C1917',
      mood: 'vibrant',
    },
    characteristics: ['Halftone dots', 'Dynamic poses', 'Bold inks', 'Action lines'],
    bestFor: ['Superhero', 'Action', 'Noir', 'Urban fantasy'],
    examplePrompt: 'a hero standing on a rooftop, comic book style, halftone shading, dramatic pose',
  },
  {
    id: 'watercolor',
    name: 'Watercolor Dream',
    category: 'illustrated',
    description: 'Soft, flowing watercolor with bleeding edges and organic textures',
    previewPromptSuffix: 'watercolor painting style, soft bleeding edges, organic textures, translucent layers, paper texture visible, delicate brushwork',
    colorPalette: {
      primary: '#7DD3FC',
      secondary: '#A78BFA',
      accent: '#FCD34D',
      background: '#FEF3C7',
      mood: 'ethereal',
    },
    characteristics: ['Soft edges', 'Color bleeding', 'Paper texture', 'Translucent layers'],
    bestFor: ['Romance', 'Fairy tales', 'Slice of life', 'Nature-based'],
    avoidFor: ['Horror', 'Gritty action'],
    examplePrompt: 'a fairy in a garden, watercolor style, soft edges, dreamy atmosphere',
  },
  {
    id: 'oil-painting',
    name: 'Classical Oil',
    category: 'illustrated',
    description: 'Rich, textured oil painting style with visible brushstrokes and dramatic lighting',
    previewPromptSuffix: 'classical oil painting, rich textures, visible brushstrokes, chiaroscuro lighting, museum quality, Renaissance inspired',
    colorPalette: {
      primary: '#78350F',
      secondary: '#B45309',
      accent: '#D97706',
      background: '#1C1917',
      mood: 'warm',
    },
    characteristics: ['Visible brushstrokes', 'Rich textures', 'Dramatic lighting', 'Deep colors'],
    bestFor: ['Historical', 'Epic fantasy', 'Drama', 'Medieval'],
    examplePrompt: 'a king on a throne, oil painting style, dramatic lighting, Renaissance composition',
  },
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    category: 'illustrated',
    description: 'Traditional East Asian ink wash painting with gradients and minimalist approach',
    previewPromptSuffix: 'traditional ink wash painting, sumi-e style, black ink gradients, rice paper texture, minimalist composition, Eastern aesthetic',
    colorPalette: {
      primary: '#1F2937',
      secondary: '#6B7280',
      accent: '#DC2626',
      background: '#F5F5F4',
      mood: 'muted',
    },
    characteristics: ['Monochromatic', 'Gradient washes', 'Minimalist', 'Negative space'],
    bestFor: ['Martial arts', 'Eastern fantasy', 'Meditation', 'Philosophy'],
    examplePrompt: 'a samurai in the mist, ink wash style, black and white, minimalist',
  },

  // --- PHOTOREALISTIC STYLES ---
  {
    id: 'live-action',
    name: 'Live Action',
    category: 'photorealistic',
    description: 'Hyper-realistic style mimicking professional photography or film',
    previewPromptSuffix: 'photorealistic, cinematic lighting, high detail, professional photography, 8k resolution, film grain, shallow depth of field',
    colorPalette: {
      primary: '#374151',
      secondary: '#6B7280',
      accent: '#F59E0B',
      background: '#111827',
      mood: 'neutral',
    },
    characteristics: ['High detail', 'Realistic lighting', 'Film grain', 'Depth of field'],
    bestFor: ['Modern settings', 'Thriller', 'Drama', 'Sci-fi'],
    examplePrompt: 'a detective in a rainy city, photorealistic, cinematic lighting, film grain',
  },
  {
    id: 'cinematic-noir',
    name: 'Cinematic Noir',
    category: 'photorealistic',
    description: 'High contrast black and white with dramatic shadows, 1940s film noir aesthetic',
    previewPromptSuffix: 'film noir style, high contrast black and white, dramatic shadows, venetian blind lighting, 1940s aesthetic, mysterious atmosphere',
    colorPalette: {
      primary: '#1F2937',
      secondary: '#4B5563',
      accent: '#F5F5F4',
      background: '#030712',
      mood: 'dark',
    },
    characteristics: ['High contrast', 'Deep shadows', 'Black and white', 'Venetian blind lighting'],
    bestFor: ['Mystery', 'Crime', 'Noir', 'Detective stories'],
    examplePrompt: 'a femme fatale in a dimly lit bar, film noir, black and white, dramatic shadows',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'photorealistic',
    description: 'Warm, sun-drenched photography with lens flares and atmospheric haze',
    previewPromptSuffix: 'golden hour photography, warm sunlight, lens flare, atmospheric haze, magic hour, orange and amber tones, cinematic warmth',
    colorPalette: {
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FCD34D',
      background: '#7C2D12',
      mood: 'warm',
    },
    characteristics: ['Warm tones', 'Lens flares', 'Atmospheric haze', 'Long shadows'],
    bestFor: ['Adventure', 'Romance', 'Western', 'Coming of age'],
    examplePrompt: 'a cowboy on horseback at sunset, golden hour lighting, lens flare, cinematic',
  },

  // --- STYLIZED STYLES ---
  {
    id: 'neon-synthwave',
    name: 'Neon Synthwave',
    category: 'stylized',
    description: 'Retro-futuristic 80s aesthetic with neon colors, grid lines, and chrome',
    previewPromptSuffix: 'synthwave aesthetic, neon pink and cyan, chrome reflections, 80s retro-futurism, grid lines, VHS aesthetic, outrun style',
    colorPalette: {
      primary: '#EC4899',
      secondary: '#06B6D4',
      accent: '#A855F7',
      background: '#0F0F23',
      mood: 'vibrant',
    },
    characteristics: ['Neon colors', 'Chrome', 'Grid patterns', 'VHS effects'],
    bestFor: ['Cyberpunk', 'Sci-fi', 'Action', '80s themed'],
    examplePrompt: 'a hacker in a neon-lit room, synthwave style, pink and cyan neon, chrome',
  },
  {
    id: 'low-poly',
    name: 'Low Poly',
    category: 'stylized',
    description: 'Geometric, faceted 3D style with clean shapes and gradient fills',
    previewPromptSuffix: 'low poly 3D style, geometric facets, clean triangular shapes, gradient fills, minimalist 3D, crystalline forms',
    colorPalette: {
      primary: '#10B981',
      secondary: '#3B82F6',
      accent: '#F472B6',
      background: '#18181B',
      mood: 'cool',
    },
    characteristics: ['Geometric shapes', 'Faceted surfaces', 'Clean gradients', 'Minimalist'],
    bestFor: ['Sci-fi', 'Abstract', 'Modern', 'Nature'],
    examplePrompt: 'a wolf in a forest, low poly style, geometric shapes, faceted design',
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass',
    category: 'stylized',
    description: 'Medieval cathedral stained glass with black lead lines and luminous colors',
    previewPromptSuffix: 'stained glass art style, black lead lines, luminous translucent colors, cathedral window aesthetic, Gothic inspired, backlit effect',
    colorPalette: {
      primary: '#7C3AED',
      secondary: '#DC2626',
      accent: '#FBBF24',
      background: '#1E1B4B',
      mood: 'ethereal',
    },
    characteristics: ['Black outlines', 'Luminous colors', 'Geometric patterns', 'Backlit glow'],
    bestFor: ['Religious themes', 'Fantasy', 'Medieval', 'Mythology'],
    examplePrompt: 'an angel with spread wings, stained glass style, luminous colors, Gothic',
  },
  {
    id: 'paper-cutout',
    name: 'Paper Cutout',
    category: 'stylized',
    description: 'Layered paper craft style with visible paper edges and subtle shadows',
    previewPromptSuffix: 'paper cutout art style, layered paper, visible edges, craft aesthetic, soft shadows between layers, handmade feel',
    colorPalette: {
      primary: '#F43F5E',
      secondary: '#38BDF8',
      accent: '#FBBF24',
      background: '#FEF2F2',
      mood: 'warm',
    },
    characteristics: ['Layered depth', 'Visible edges', 'Soft shadows', 'Craft aesthetic'],
    bestFor: ['Children stories', 'Whimsical', 'Educational', 'Folk tales'],
    examplePrompt: 'a house in a meadow, paper cutout style, layered paper, craft aesthetic',
  },

  // --- RETRO STYLES ---
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    category: 'retro',
    description: 'Classic 16-bit video game pixel art with limited color palette',
    previewPromptSuffix: 'pixel art style, 16-bit aesthetic, limited color palette, dithering, retro video game, crisp pixels, no anti-aliasing',
    colorPalette: {
      primary: '#22C55E',
      secondary: '#3B82F6',
      accent: '#EF4444',
      background: '#1E293B',
      mood: 'vibrant',
    },
    characteristics: ['Visible pixels', 'Limited palette', 'Dithering', 'No anti-aliasing'],
    bestFor: ['Gaming themes', 'Retro', 'Nostalgia', 'Action'],
    examplePrompt: 'a knight with a sword, pixel art, 16-bit style, retro gaming aesthetic',
  },
  {
    id: 'vhs-glitch',
    name: 'VHS Glitch',
    category: 'retro',
    description: 'Corrupted VHS tape aesthetic with scan lines, tracking errors, and RGB split',
    previewPromptSuffix: 'VHS tape aesthetic, scan lines, tracking errors, RGB color split, glitch effects, 80s video quality, analog distortion',
    colorPalette: {
      primary: '#F43F5E',
      secondary: '#06B6D4',
      accent: '#FBBF24',
      background: '#0F172A',
      mood: 'dark',
    },
    characteristics: ['Scan lines', 'RGB split', 'Tracking errors', 'Noise grain'],
    bestFor: ['Horror', 'Mystery', 'Found footage', 'Psychological'],
    examplePrompt: 'a face on a TV screen, VHS glitch style, scan lines, RGB split, distorted',
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    category: 'retro',
    description: '1920s Art Deco with geometric patterns, gold accents, and symmetry',
    previewPromptSuffix: 'Art Deco style, 1920s aesthetic, geometric patterns, gold and black, symmetrical composition, Gatsby era, elegant lines',
    colorPalette: {
      primary: '#D4AF37',
      secondary: '#1C1917',
      accent: '#FAFAF9',
      background: '#18181B',
      mood: 'warm',
    },
    characteristics: ['Geometric patterns', 'Gold accents', 'Symmetry', 'Elegant lines'],
    bestFor: ['1920s settings', 'Luxury', 'Mystery', 'Glamour'],
    examplePrompt: 'a flapper at a party, Art Deco style, geometric patterns, gold accents',
  },
  {
    id: 'soviet-propaganda',
    name: 'Soviet Propaganda',
    category: 'retro',
    description: 'Bold constructivist poster style with limited colors and heroic poses',
    previewPromptSuffix: 'Soviet propaganda poster style, constructivist, bold red and black, heroic pose, geometric composition, limited color palette',
    colorPalette: {
      primary: '#DC2626',
      secondary: '#1C1917',
      accent: '#FBBF24',
      background: '#FEF3C7',
      mood: 'vibrant',
    },
    characteristics: ['Bold colors', 'Heroic poses', 'Geometric', 'Propaganda aesthetic'],
    bestFor: ['Dystopia', 'Revolution', 'Political', 'Alternative history'],
    examplePrompt: 'a worker raising a hammer, Soviet propaganda style, red and black, bold',
  },

  // --- EXPERIMENTAL STYLES ---
  {
    id: 'glitchcore',
    name: 'Glitchcore',
    category: 'experimental',
    description: 'Digital corruption aesthetic with data moshing, chromatic aberration, and fragmentation',
    previewPromptSuffix: 'glitchcore aesthetic, data corruption, chromatic aberration, pixel sorting, fragmented reality, digital artifacts, cyberpunk glitch',
    colorPalette: {
      primary: '#A855F7',
      secondary: '#22D3EE',
      accent: '#F43F5E',
      background: '#020617',
      mood: 'dark',
    },
    characteristics: ['Chromatic aberration', 'Fragmentation', 'Digital artifacts', 'Distortion'],
    bestFor: ['Cyberpunk', 'Psychological', 'Surreal', 'Sci-fi horror'],
    examplePrompt: 'a face fragmenting into pixels, glitchcore, chromatic aberration, corrupted',
  },
  {
    id: 'bioluminescent',
    name: 'Bioluminescent',
    category: 'experimental',
    description: 'Deep sea inspired with glowing organisms, dark backgrounds, and ethereal light',
    previewPromptSuffix: 'bioluminescent aesthetic, deep sea glow, ethereal light sources, dark background, organic luminescence, otherworldly atmosphere',
    colorPalette: {
      primary: '#06B6D4',
      secondary: '#A855F7',
      accent: '#4ADE80',
      background: '#020617',
      mood: 'ethereal',
    },
    characteristics: ['Self-luminous', 'Dark backgrounds', 'Ethereal glow', 'Organic forms'],
    bestFor: ['Alien worlds', 'Deep sea', 'Fantasy', 'Mysterious'],
    examplePrompt: 'a creature in deep water, bioluminescent, glowing in darkness, ethereal',
  },
  {
    id: 'double-exposure',
    name: 'Double Exposure',
    category: 'experimental',
    description: 'Overlaid imagery creating surreal composites of subjects and environments',
    previewPromptSuffix: 'double exposure photography, overlaid images, surreal composite, blended silhouettes, artistic photography, dreamlike merge',
    colorPalette: {
      primary: '#6366F1',
      secondary: '#F97316',
      accent: '#10B981',
      background: '#1E1B4B',
      mood: 'ethereal',
    },
    characteristics: ['Overlaid images', 'Silhouettes', 'Blend modes', 'Surreal compositions'],
    bestFor: ['Introspective', 'Nature themes', 'Identity', 'Psychological'],
    examplePrompt: 'a woman and a forest, double exposure, silhouette blend, surreal',
  },
  {
    id: 'infrared',
    name: 'Infrared Dream',
    category: 'experimental',
    description: 'False color infrared photography with pink foliage and surreal color shifts',
    previewPromptSuffix: 'infrared photography style, false colors, pink and white foliage, surreal color palette, dreamlike atmosphere, otherworldly',
    colorPalette: {
      primary: '#F472B6',
      secondary: '#FAFAF9',
      accent: '#0EA5E9',
      background: '#4C1D95',
      mood: 'ethereal',
    },
    characteristics: ['False colors', 'Pink vegetation', 'Surreal tones', 'Dreamlike'],
    bestFor: ['Fantasy', 'Alien worlds', 'Dreaming', 'Surreal'],
    examplePrompt: 'a forest path, infrared photography, pink foliage, surreal colors',
  },

  // --- CULTURAL STYLES ---
  {
    id: 'ukiyo-e',
    name: 'Ukiyo-e',
    category: 'cultural',
    description: 'Traditional Japanese woodblock print style with flat colors and flowing lines',
    previewPromptSuffix: 'ukiyo-e style, Japanese woodblock print, flat colors, flowing lines, traditional composition, Hokusai inspired, decorative patterns',
    colorPalette: {
      primary: '#1E40AF',
      secondary: '#DC2626',
      accent: '#FBBF24',
      background: '#FEF3C7',
      mood: 'muted',
    },
    characteristics: ['Flat colors', 'Flowing lines', 'Wave patterns', 'Nature motifs'],
    bestFor: ['Japanese settings', 'Samurai', 'Nature', 'Mythology'],
    examplePrompt: 'a wave crashing on shore, ukiyo-e style, Japanese woodblock, Hokusai',
  },
  {
    id: 'african-tribal',
    name: 'African Tribal',
    category: 'cultural',
    description: 'Bold geometric patterns inspired by African tribal art with earth tones',
    previewPromptSuffix: 'African tribal art style, bold geometric patterns, earth tones, traditional motifs, ceremonial aesthetic, vibrant contrasts',
    colorPalette: {
      primary: '#92400E',
      secondary: '#DC2626',
      accent: '#FBBF24',
      background: '#1C1917',
      mood: 'warm',
    },
    characteristics: ['Geometric patterns', 'Earth tones', 'Bold contrasts', 'Traditional motifs'],
    bestFor: ['African settings', 'Mythology', 'Ceremony', 'Warriors'],
    examplePrompt: 'a warrior with a spear, African tribal style, geometric patterns, earth tones',
  },
  {
    id: 'persian-miniature',
    name: 'Persian Miniature',
    category: 'cultural',
    description: 'Intricate Persian miniature painting with gold leaf and detailed patterns',
    previewPromptSuffix: 'Persian miniature painting style, intricate details, gold leaf accents, ornate borders, flattened perspective, jewel tones',
    colorPalette: {
      primary: '#0369A1',
      secondary: '#DC2626',
      accent: '#D4AF37',
      background: '#FEF3C7',
      mood: 'warm',
    },
    characteristics: ['Intricate details', 'Gold accents', 'Ornate borders', 'Jewel tones'],
    bestFor: ['Middle Eastern', 'Historical', 'Romance', 'Court intrigue'],
    examplePrompt: 'a sultan in a garden, Persian miniature style, gold leaf, ornate details',
  },
  {
    id: 'dia-de-muertos',
    name: 'Dia de Muertos',
    category: 'cultural',
    description: 'Vibrant Mexican Day of the Dead aesthetic with sugar skulls and marigolds',
    previewPromptSuffix: 'Dia de los Muertos style, sugar skull aesthetic, vibrant marigolds, papel picado, festive colors, Mexican folk art',
    colorPalette: {
      primary: '#F97316',
      secondary: '#A855F7',
      accent: '#22C55E',
      background: '#1C1917',
      mood: 'vibrant',
    },
    characteristics: ['Sugar skulls', 'Bright colors', 'Floral motifs', 'Folk art patterns'],
    bestFor: ['Death themes', 'Celebration', 'Mexican settings', 'Supernatural'],
    examplePrompt: 'a skeleton bride, Dia de Muertos style, sugar skull makeup, marigolds',
  },
];

// =============================================================================
// PRESET CONTENT TYPES
// =============================================================================

export interface WorldPreset {
  id: string;
  name: string;
  description: string;
  setting: string;
  tone: string;
  suggestedStyles: string[]; // IDs of recommended art styles
  keyLocations: string[];
  themes: string[];
}

export interface StoryPreset {
  id: string;
  name: string;
  description: string;
  genre: string;
  premise: string;
  suggestedWorld?: string; // ID of recommended world
  suggestedStyles: string[];
  keyPlotPoints: string[];
}

export interface CharacterPreset {
  id: string;
  name: string;
  archetype: string;
  description: string;
  personality: string;
  backstoryHook: string;
  suggestedStyles: string[];
  traits: string[];
  careers: string[];
}

// =============================================================================
// WORLD PRESETS
// =============================================================================

export const WORLD_PRESETS: WorldPreset[] = [
  {
    id: 'neon-sprawl',
    name: 'The Neon Sprawl',
    description: 'A rain-soaked megacity where corporations rule and the streets never sleep',
    setting: 'Cyberpunk megacity, year 2087',
    tone: 'Gritty, noir, high-tech-low-life',
    suggestedStyles: ['neon-synthwave', 'cinematic-noir', 'glitchcore'],
    keyLocations: ['Undercity markets', 'Corporate towers', 'Neon-lit bars', 'Abandoned data centers'],
    themes: ['Class divide', 'Identity', 'Corporate control', 'Humanity vs technology'],
  },
  {
    id: 'shattered-realms',
    name: 'The Shattered Realms',
    description: 'A fantasy world where continents float in an endless sky after a magical cataclysm',
    setting: 'High fantasy, post-apocalyptic magical world',
    tone: 'Epic, mysterious, adventurous',
    suggestedStyles: ['watercolor', 'stained-glass', 'oil-painting'],
    keyLocations: ['Floating islands', 'Crystal spires', 'Ancient ruins', 'Sky harbors'],
    themes: ['Rebuilding', 'Lost magic', 'Unity vs division', 'Environmental balance'],
  },
  {
    id: 'hollow-earth',
    name: 'Hollow Earth',
    description: 'Victorian explorers discover a hidden world beneath the surface with prehistoric life',
    setting: 'Victorian steampunk, subterranean world',
    tone: 'Adventurous, mysterious, scientific wonder',
    suggestedStyles: ['art-deco', 'oil-painting', 'bioluminescent'],
    keyLocations: ['Crystal caverns', 'Underground seas', 'Lost civilizations', 'Volcanic vents'],
    themes: ['Discovery', 'Nature vs progress', 'Hidden histories', 'Evolution'],
  },
  {
    id: 'digital-frontier',
    name: 'The Digital Frontier',
    description: 'Consciousness uploaded to a vast digital realm where physics bends to will',
    setting: 'Virtual reality multiverse',
    tone: 'Surreal, philosophical, action-packed',
    suggestedStyles: ['low-poly', 'glitchcore', 'neon-synthwave'],
    keyLocations: ['Data streams', 'Memory palaces', 'Viral wastelands', 'Code sanctuaries'],
    themes: ['Identity', 'Reality vs simulation', 'Digital immortality', 'Free will'],
  },
  {
    id: 'whisper-woods',
    name: 'The Whisper Woods',
    description: 'An enchanted forest where nature spirits guide and test those who enter',
    setting: 'Fairy tale forest realm',
    tone: 'Whimsical, mysterious, emotionally resonant',
    suggestedStyles: ['watercolor', 'paper-cutout', 'ink-wash'],
    keyLocations: ['The Talking Grove', 'Witch\'s cottage', 'Fairy circles', 'The Dark Hollow'],
    themes: ['Growth', 'Nature\'s wisdom', 'Facing fears', 'Balance'],
  },
  {
    id: 'iron-kingdoms',
    name: 'The Iron Kingdoms',
    description: 'A brutal medieval world where rival houses wage endless war for a fractured throne',
    setting: 'Dark medieval fantasy',
    tone: 'Gritty, political, morally gray',
    suggestedStyles: ['oil-painting', 'cinematic-noir', 'ink-wash'],
    keyLocations: ['Fortress keeps', 'Plague-ridden villages', 'Sacred battlefields', 'Secret courts'],
    themes: ['Power', 'Loyalty', 'Sacrifice', 'The cost of war'],
  },
];

// =============================================================================
// STORY PRESETS
// =============================================================================

export const STORY_PRESETS: StoryPreset[] = [
  {
    id: 'heist-gone-wrong',
    name: 'The Heist Gone Wrong',
    description: 'A crew of specialists attempt an impossible job, but nothing goes as planned',
    genre: 'Heist thriller',
    premise: 'You\'re hired for one last job that promises to set you up for life, but the target holds secrets that change everything',
    suggestedStyles: ['cinematic-noir', 'live-action', 'neon-synthwave'],
    keyPlotPoints: ['Assembling the crew', 'The planning montage', 'Everything falls apart', 'Improvising to survive', 'The double-cross revealed'],
  },
  {
    id: 'chosen-reluctant',
    name: 'The Reluctant Chosen',
    description: 'You never wanted to be a hero, but fate had other plans',
    genre: 'Epic fantasy',
    premise: 'An ancient prophecy names you as the one who will save or doom the world, and both sides want to control you',
    suggestedWorld: 'shattered-realms',
    suggestedStyles: ['watercolor', 'stained-glass', 'cel-shaded'],
    keyPlotPoints: ['The call to adventure', 'Refusing the call', 'Meeting the mentor', 'Trials and growth', 'The final confrontation'],
  },
  {
    id: 'memory-hunter',
    name: 'Memory Hunter',
    description: 'In a world where memories can be stolen and sold, you track down those who take what doesn\'t belong to them',
    genre: 'Sci-fi noir',
    premise: 'A case leads you to memories of your own past - ones you don\'t remember having',
    suggestedWorld: 'neon-sprawl',
    suggestedStyles: ['neon-synthwave', 'glitchcore', 'double-exposure'],
    keyPlotPoints: ['A mysterious client', 'Diving into stolen memories', 'Your own memories surface', 'Conspiracy revealed', 'Identity crisis'],
  },
  {
    id: 'court-intrigue',
    name: 'Whispers in the Court',
    description: 'Navigate deadly political games where words are weapons and trust is a luxury',
    genre: 'Political drama',
    premise: 'As a minor noble, you uncover a plot against the crown, but exposing it means risking everything',
    suggestedWorld: 'iron-kingdoms',
    suggestedStyles: ['persian-miniature', 'oil-painting', 'art-deco'],
    keyPlotPoints: ['Arriving at court', 'Making allies and enemies', 'The plot thickens', 'Betrayal', 'The final gambit'],
  },
  {
    id: 'spirit-walker',
    name: 'Spirit Walker',
    description: 'Bridge the world of the living and dead to solve mysteries that span both realms',
    genre: 'Supernatural mystery',
    premise: 'The dead are restless, and only you can hear their pleas for justice',
    suggestedStyles: ['ink-wash', 'bioluminescent', 'dia-de-muertos'],
    keyPlotPoints: ['First contact with spirits', 'Learning the rules', 'A spirit\'s desperate plea', 'Uncovering dark secrets', 'Bringing peace'],
  },
  {
    id: 'survival-horror',
    name: 'Survival Protocol',
    description: 'Something is hunting the crew of a remote research station',
    genre: 'Horror survival',
    premise: 'Cut off from the outside world, you must survive until rescue arrives - if it arrives',
    suggestedStyles: ['vhs-glitch', 'cinematic-noir', 'bioluminescent'],
    keyPlotPoints: ['Isolation established', 'First signs of danger', 'Trust breaks down', 'Fighting back', 'The final escape'],
  },
];

// =============================================================================
// CHARACTER PRESETS
// =============================================================================

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'cynical-veteran',
    name: 'The Cynical Veteran',
    archetype: 'Anti-hero',
    description: 'Seen too much, done too much, but still can\'t walk away when innocents are in danger',
    personality: 'World-weary, sarcastic, secretly idealistic',
    backstoryHook: 'A past mission went catastrophically wrong, leaving scars visible and invisible',
    suggestedStyles: ['cinematic-noir', 'live-action', 'oil-painting'],
    traits: ['Tactical mind', 'Haunted by the past', 'Reluctant protector', 'Drinks too much'],
    careers: ['Soldier', 'Mercenary', 'Detective', 'Bodyguard'],
  },
  {
    id: 'charming-rogue',
    name: 'The Charming Rogue',
    archetype: 'Trickster',
    description: 'Quick with a smile, quicker with their fingers, always has an angle',
    personality: 'Charismatic, opportunistic, surprisingly loyal',
    backstoryHook: 'Growing up on the streets taught them that survival means taking what you need',
    suggestedStyles: ['comic-book', 'art-deco', 'cel-shaded'],
    traits: ['Silver tongue', 'Light fingers', 'Heart of gold', 'Can\'t resist a mark'],
    careers: ['Thief', 'Con artist', 'Gambler', 'Fence'],
  },
  {
    id: 'haunted-scholar',
    name: 'The Haunted Scholar',
    archetype: 'Seeker',
    description: 'Knowledge is power, but some truths come at terrible cost',
    personality: 'Obsessive, brilliant, socially awkward',
    backstoryHook: 'Their research accidentally unleashed something that shouldn\'t exist',
    suggestedStyles: ['ink-wash', 'watercolor', 'bioluminescent'],
    traits: ['Encyclopedic knowledge', 'Obsessive researcher', 'Socially blind', 'Guilt-driven'],
    careers: ['Professor', 'Archivist', 'Occultist', 'Scientist'],
  },
  {
    id: 'fallen-noble',
    name: 'The Fallen Noble',
    archetype: 'Redeemer',
    description: 'Once had everything, now fights to earn back honor the hard way',
    personality: 'Proud, adaptable, seeking redemption',
    backstoryHook: 'Stripped of title and lands after being framed for a crime they didn\'t commit',
    suggestedStyles: ['oil-painting', 'persian-miniature', 'stained-glass'],
    traits: ['Noble bearing', 'Combat trained', 'Political knowledge', 'Pride before fall'],
    careers: ['Disgraced knight', 'Exile', 'Wanderer', 'Vigilante'],
  },
  {
    id: 'wild-spirit',
    name: 'The Wild Spirit',
    archetype: 'Force of nature',
    description: 'Civilization is a cage - freedom is the only truth',
    personality: 'Untamed, intuitive, fiercely protective of nature',
    backstoryHook: 'Raised by nature itself after being abandoned as a child',
    suggestedStyles: ['watercolor', 'ukiyo-e', 'infrared'],
    traits: ['Animal kinship', 'Primal instincts', 'Civilization blind', 'Nature\'s champion'],
    careers: ['Ranger', 'Druid', 'Hunter', 'Hermit'],
  },
  {
    id: 'true-believer',
    name: 'The True Believer',
    archetype: 'Zealot',
    description: 'Absolute faith in a cause or creed, for better or worse',
    personality: 'Devoted, rigid, capable of terrible mercy',
    backstoryHook: 'A miraculous event convinced them they were chosen for a divine purpose',
    suggestedStyles: ['stained-glass', 'soviet-propaganda', 'african-tribal'],
    traits: ['Unshakeable faith', 'Inspiring presence', 'Black and white morality', 'Self-sacrificing'],
    careers: ['Priest', 'Paladin', 'Inquisitor', 'Crusader'],
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getStyleById(id: string): ArtStylePreset | undefined {
  return ART_STYLE_PRESETS.find(style => style.id === id);
}

export function getStylesByCategory(category: ArtStyleCategory): ArtStylePreset[] {
  return ART_STYLE_PRESETS.filter(style => style.category === category);
}

export function getStylesForTheme(themeKeywords: string[]): ArtStylePreset[] {
  const keywords = themeKeywords.map(k => k.toLowerCase());
  return ART_STYLE_PRESETS.filter(style =>
    style.bestFor.some(b => keywords.some(k => b.toLowerCase().includes(k)))
  );
}

export function buildPromptWithStyle(basePrompt: string, styleId: string): string {
  const style = getStyleById(styleId);
  if (!style) return basePrompt;
  return `${basePrompt}, ${style.previewPromptSuffix}`;
}

export function getWorldById(id: string): WorldPreset | undefined {
  return WORLD_PRESETS.find(world => world.id === id);
}

export function getStoryById(id: string): StoryPreset | undefined {
  return STORY_PRESETS.find(story => story.id === id);
}

export function getCharacterById(id: string): CharacterPreset | undefined {
  return CHARACTER_PRESETS.find(character => character.id === id);
}

export const ART_STYLE_CATEGORIES: { id: ArtStyleCategory; name: string; description: string }[] = [
  { id: 'illustrated', name: 'Illustrated', description: 'Hand-drawn and painted styles' },
  { id: 'photorealistic', name: 'Photorealistic', description: 'Camera and film-based aesthetics' },
  { id: 'stylized', name: 'Stylized', description: 'Unique visual interpretations' },
  { id: 'retro', name: 'Retro', description: 'Historical and vintage looks' },
  { id: 'experimental', name: 'Experimental', description: 'Avant-garde and unconventional' },
  { id: 'cultural', name: 'Cultural', description: 'Traditional art from around the world' },
];
