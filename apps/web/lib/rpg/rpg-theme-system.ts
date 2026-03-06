/**
 * RPG Theme System - Structured Data for Consistent Image Generation
 *
 * Provides theme-specific visual descriptors for Flux Schnell image generation.
 * Each theme includes: color palettes, artistic styles, character archetypes,
 * scene settings, and prompt modifiers for consistent visual identity.
 */

export type RPGTheme = 'cyberpunk' | 'fantasy' | 'noir' | 'fallout' | 'medieval' | 'scifi';

export type ImageCategory = 'character' | 'scene' | 'background' | 'item' | 'action';

export type ArtStyle = 'anime' | 'realistic' | 'pixel' | 'watercolor' | 'comic' | 'fantasy';

// Character archetype definitions for each theme
export interface CharacterArchetype {
  id: string;
  name: string;
  visualDescriptors: string[];
  attire: string[];
  accessories: string[];
  poses: string[];
}

// Scene setting templates
export interface SceneSetting {
  id: string;
  name: string;
  environmentDescriptors: string[];
  lighting: string[];
  atmosphere: string[];
  props: string[];
}

// Color palette for visual consistency
export interface ThemeColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
  mood: string; // Overall color mood descriptor
}

// Complete theme configuration
export interface RPGThemeConfig {
  id: RPGTheme;
  name: string;
  description: string;
  defaultArtStyle: ArtStyle;
  colorPalette: ThemeColorPalette;
  visualStyle: string; // Base visual style prompt
  characterArchetypes: CharacterArchetype[];
  sceneSettings: SceneSetting[];
  promptModifiers: {
    quality: string;
    style: string;
    atmosphere: string;
    negative: string; // Things to avoid
  };
}

// ============================================================
// THEME CONFIGURATIONS
// ============================================================

export const CYBERPUNK_THEME: RPGThemeConfig = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  description: 'Neon-lit dystopian future with corporate intrigue and digital shadows',
  defaultArtStyle: 'realistic',
  colorPalette: {
    primary: ['#00ff9f', '#00b8ff', '#ff0055'],
    secondary: ['#1a1a2e', '#16213e', '#0f3460'],
    accent: ['#e94560', '#00fff5', '#ff6b6b'],
    mood: 'neon-soaked, high contrast, electric',
  },
  visualStyle: 'cyberpunk aesthetic, neon lights, rain-slicked streets, holographic displays, chrome and steel, dystopian megacity',
  characterArchetypes: [
    {
      id: 'netrunner',
      name: 'Netrunner',
      visualDescriptors: ['cybernetic implants', 'neural interface ports', 'glowing eyes', 'tech-enhanced'],
      attire: ['black tactical jacket', 'tech-wear', 'armored vest', 'hooded coat'],
      accessories: ['data cables', 'holographic HUD', 'cyberdeck', 'neural jack'],
      poses: ['hacking stance', 'crouched with data cables', 'standing in neon rain'],
    },
    {
      id: 'corpo',
      name: 'Corporate Agent',
      visualDescriptors: ['sleek appearance', 'subtle augmentations', 'calculating gaze', 'pristine'],
      attire: ['designer suit', 'corporate uniform', 'expensive coat', 'smart fabric'],
      accessories: ['AR glasses', 'hidden weapons', 'corporate ID chip', 'encrypted comm'],
      poses: ['power stance', 'seated in luxury', 'boardroom authority'],
    },
    {
      id: 'street-samurai',
      name: 'Street Samurai',
      visualDescriptors: ['combat implants', 'scarred', 'muscular', 'lethal presence'],
      attire: ['combat armor', 'tactical gear', 'armored trench coat', 'military surplus'],
      accessories: ['katana', 'smart weapons', 'cybernetic arms', 'combat visor'],
      poses: ['combat ready', 'weapon drawn', 'standing guard'],
    },
    {
      id: 'fixer',
      name: 'Fixer',
      visualDescriptors: ['charismatic', 'street-smart', 'well-connected look', 'adaptive'],
      attire: ['stylish street wear', 'vintage jacket', 'eclectic mix', 'memorable outfit'],
      accessories: ['multiple phones', 'encrypted tablet', 'concealed pistol', 'jewelry'],
      poses: ['negotiating', 'casual confidence', 'back-alley meeting'],
    },
  ],
  sceneSettings: [
    {
      id: 'neon-alley',
      name: 'Neon Alley',
      environmentDescriptors: ['narrow alleyway', 'towering buildings', 'holographic ads', 'steam vents'],
      lighting: ['neon signs', 'rain reflections', 'flickering lights', 'pink and cyan glow'],
      atmosphere: ['rain', 'fog', 'crowded', 'dangerous'],
      props: ['dumpsters', 'fire escapes', 'street vendors', 'graffiti'],
    },
    {
      id: 'corporate-tower',
      name: 'Corporate Tower',
      environmentDescriptors: ['glass skyscraper', 'minimalist interior', 'security checkpoints', 'pristine'],
      lighting: ['cold white LEDs', 'holographic displays', 'dramatic shadows', 'accent lighting'],
      atmosphere: ['sterile', 'oppressive', 'luxurious', 'surveilled'],
      props: ['security drones', 'reception desk', 'executive furniture', 'digital art'],
    },
    {
      id: 'nightclub',
      name: 'Underground Nightclub',
      environmentDescriptors: ['packed dance floor', 'VIP booths', 'industrial architecture', 'hidden'],
      lighting: ['strobing lights', 'laser grids', 'UV glow', 'neon tubes'],
      atmosphere: ['loud', 'chaotic', 'sensory overload', 'anonymous'],
      props: ['DJ booth', 'bar counter', 'chrome furniture', 'dancers'],
    },
  ],
  promptModifiers: {
    quality: 'highly detailed, 8k resolution, cinematic composition, professional photography',
    style: 'blade runner aesthetic, ghost in the shell influence, akira inspired, william gibson vision',
    atmosphere: 'rain, neon reflections, volumetric fog, high contrast lighting',
    negative: 'bright daylight, natural settings, medieval, fantasy elements, cartoon style',
  },
};

export const FANTASY_THEME: RPGThemeConfig = {
  id: 'fantasy',
  name: 'Fantasy',
  description: 'Epic magic, ancient prophecies, and mythical creatures',
  defaultArtStyle: 'fantasy',
  colorPalette: {
    primary: ['#4a7c59', '#2d5a27', '#8b4513'],
    secondary: ['#f4e4bc', '#daa520', '#8b7355'],
    accent: ['#9932cc', '#00ced1', '#ffd700'],
    mood: 'rich, earthy, magical undertones',
  },
  visualStyle: 'high fantasy art, magical atmosphere, epic landscapes, detailed medieval architecture, mystical lighting',
  characterArchetypes: [
    {
      id: 'mage',
      name: 'Mage',
      visualDescriptors: ['wise expression', 'magical aura', 'ancient knowledge', 'mystical presence'],
      attire: ['flowing robes', 'enchanted cloak', 'wizard hat', 'ceremonial garments'],
      accessories: ['staff', 'spell book', 'glowing orbs', 'magical jewelry'],
      poses: ['casting spell', 'reading tome', 'meditation', 'channeling power'],
    },
    {
      id: 'warrior',
      name: 'Warrior',
      visualDescriptors: ['battle-hardened', 'strong build', 'scarred', 'determined gaze'],
      attire: ['plate armor', 'chainmail', 'battle-worn leather', 'clan colors'],
      accessories: ['sword', 'shield', 'war banner', 'family crest'],
      poses: ['battle stance', 'sword raised', 'defending', 'victorious'],
    },
    {
      id: 'ranger',
      name: 'Ranger',
      visualDescriptors: ['keen eyes', 'weathered', 'nimble', 'one with nature'],
      attire: ['leather armor', 'forest cloak', 'travel-worn clothing', 'camouflage'],
      accessories: ['bow', 'quiver', 'hunting knife', 'animal companion'],
      poses: ['drawing bow', 'tracking', 'crouched observation', 'communing with nature'],
    },
    {
      id: 'rogue',
      name: 'Rogue',
      visualDescriptors: ['cunning expression', 'quick reflexes', 'shadowy', 'charming'],
      attire: ['dark leather', 'hooded cloak', 'light armor', 'practical clothing'],
      accessories: ['daggers', 'lockpicks', 'poison vials', 'grappling hook'],
      poses: ['lurking in shadows', 'picking lock', 'surprise attack', 'counting gold'],
    },
  ],
  sceneSettings: [
    {
      id: 'enchanted-forest',
      name: 'Enchanted Forest',
      environmentDescriptors: ['ancient trees', 'glowing mushrooms', 'fairy lights', 'mystical fog'],
      lighting: ['dappled sunlight', 'bioluminescence', 'magical glow', 'ethereal rays'],
      atmosphere: ['mysterious', 'serene', 'alive with magic', 'ancient'],
      props: ['stone circles', 'fairy rings', 'crystal formations', 'ancient ruins'],
    },
    {
      id: 'castle',
      name: 'Medieval Castle',
      environmentDescriptors: ['towering walls', 'grand hall', 'stone architecture', 'banners'],
      lighting: ['torchlight', 'candlelit', 'moonlight through windows', 'fireplace glow'],
      atmosphere: ['majestic', 'historic', 'noble', 'imposing'],
      props: ['throne', 'tapestries', 'suits of armor', 'long tables'],
    },
    {
      id: 'dragon-lair',
      name: 'Dragon Lair',
      environmentDescriptors: ['vast cavern', 'treasure hoard', 'volcanic vents', 'dragon bones'],
      lighting: ['fire glow', 'molten gold reflection', 'gem sparkle', 'dramatic shadows'],
      atmosphere: ['dangerous', 'awe-inspiring', 'ancient evil', 'treasure-filled'],
      props: ['gold piles', 'ancient artifacts', 'dragon eggs', 'adventurer remains'],
    },
  ],
  promptModifiers: {
    quality: 'highly detailed fantasy illustration, masterwork quality, epic composition',
    style: 'tolkien inspired, dungeons and dragons aesthetic, classic fantasy art, detailed illustration',
    atmosphere: 'magical particles, ethereal glow, dramatic lighting, epic scale',
    negative: 'modern technology, sci-fi elements, neon lights, urban settings',
  },
};

export const NOIR_THEME: RPGThemeConfig = {
  id: 'noir',
  name: 'Noir',
  description: '1940s detective mystery, femme fatales, and moral ambiguity',
  defaultArtStyle: 'realistic',
  colorPalette: {
    primary: ['#1a1a1a', '#2c2c2c', '#4a4a4a'],
    secondary: ['#8b8b8b', '#b8860b', '#8b0000'],
    accent: ['#ff4444', '#ffd700', '#ffffff'],
    mood: 'monochromatic, high contrast, shadows dominant',
  },
  visualStyle: 'film noir aesthetic, dramatic shadows, venetian blind lighting, 1940s atmosphere, black and white with selective color',
  characterArchetypes: [
    {
      id: 'detective',
      name: 'Private Detective',
      visualDescriptors: ['weary eyes', 'five o\'clock shadow', 'cynical expression', 'world-weary'],
      attire: ['trench coat', 'fedora', 'rumpled suit', 'loose tie'],
      accessories: ['revolver', 'flask', 'cigarette', 'notepad'],
      poses: ['leaning on desk', 'smoking by window', 'interrogating', 'shadowy silhouette'],
    },
    {
      id: 'femme-fatale',
      name: 'Femme Fatale',
      visualDescriptors: ['mysterious beauty', 'dangerous allure', 'calculating eyes', 'elegant'],
      attire: ['evening gown', 'fur stole', 'pencil skirt', 'elegant dress'],
      accessories: ['cigarette holder', 'pearl necklace', 'small pistol', 'expensive perfume'],
      poses: ['lounging seductively', 'entering dramatically', 'lighting cigarette', 'mysterious glance'],
    },
    {
      id: 'gangster',
      name: 'Gangster',
      visualDescriptors: ['menacing presence', 'expensive tastes', 'cold eyes', 'powerful'],
      attire: ['pinstripe suit', 'expensive overcoat', 'silk tie', 'polished shoes'],
      accessories: ['tommy gun', 'cigar', 'gold rings', 'pocket watch'],
      poses: ['counting money', 'intimidating', 'seated in power', 'giving orders'],
    },
  ],
  sceneSettings: [
    {
      id: 'office',
      name: 'Detective Office',
      environmentDescriptors: ['cramped room', 'cluttered desk', 'filing cabinets', 'frosted glass door'],
      lighting: ['venetian blind shadows', 'desk lamp', 'neon sign outside', 'dramatic shadows'],
      atmosphere: ['smoky', 'lonely', 'late night', 'noir'],
      props: ['whiskey bottle', 'ashtray', 'case files', 'typewriter'],
    },
    {
      id: 'nightclub',
      name: 'Jazz Club',
      environmentDescriptors: ['smoky interior', 'stage with band', 'bar counter', 'intimate tables'],
      lighting: ['spotlight', 'dim ambiance', 'cigarette smoke haze', 'red accents'],
      atmosphere: ['sultry', 'dangerous', 'glamorous', 'secretive'],
      props: ['piano', 'microphone', 'cocktail glasses', 'jazz instruments'],
    },
    {
      id: 'rainy-street',
      name: 'Rainy Street',
      environmentDescriptors: ['wet pavement', '1940s cars', 'street lamps', 'shop fronts'],
      lighting: ['street lamp pools', 'rain reflections', 'neon signs', 'car headlights'],
      atmosphere: ['rainy', 'abandoned', 'dangerous', 'melancholic'],
      props: ['fire hydrant', 'newspaper stand', 'phone booth', 'parked cars'],
    },
  ],
  promptModifiers: {
    quality: 'cinematic composition, film grain, high contrast, dramatic lighting',
    style: 'film noir, 1940s aesthetic, sin city influence, raymond chandler atmosphere',
    atmosphere: 'heavy shadows, cigarette smoke, rain, venetian blind patterns',
    negative: 'bright colors, modern technology, fantasy elements, daylight scenes',
  },
};

export const FALLOUT_THEME: RPGThemeConfig = {
  id: 'fallout',
  name: 'Fallout',
  description: 'Post-apocalyptic wasteland survival',
  defaultArtStyle: 'realistic',
  colorPalette: {
    primary: ['#8b7355', '#a0522d', '#6b4423'],
    secondary: ['#556b2f', '#2f4f4f', '#696969'],
    accent: ['#32cd32', '#ffd700', '#ff4500'],
    mood: 'desaturated, dusty, radioactive green accents',
  },
  visualStyle: 'post-apocalyptic wasteland, retro-futuristic 1950s aesthetic, nuclear devastation, survival atmosphere',
  characterArchetypes: [
    {
      id: 'vault-dweller',
      name: 'Vault Dweller',
      visualDescriptors: ['clean but weathering', 'naive expression', 'curious', 'adapting'],
      attire: ['vault jumpsuit', 'pip-boy', 'utility belt', 'modified vault gear'],
      accessories: ['pip-boy 3000', '10mm pistol', 'vault canteen', 'medical supplies'],
      poses: ['checking pip-boy', 'scanning horizon', 'defensive stance', 'exploring'],
    },
    {
      id: 'wastelander',
      name: 'Wastelander',
      visualDescriptors: ['weathered face', 'hardened survivor', 'resourceful look', 'scarred'],
      attire: ['scavenged armor', 'leather gear', 'makeshift protection', 'layered clothing'],
      accessories: ['makeshift weapons', 'gas mask', 'bottle caps', 'survival gear'],
      poses: ['aiming rifle', 'bartering', 'campfire rest', 'alert watch'],
    },
    {
      id: 'brotherhood',
      name: 'Brotherhood of Steel',
      visualDescriptors: ['military bearing', 'proud stance', 'technology guardian', 'imposing'],
      attire: ['power armor', 'BOS uniform', 'combat armor', 'knight insignia'],
      accessories: ['laser rifle', 'holotags', 'brotherhood banner', 'vertibird'],
      poses: ['power armor stance', 'saluting', 'operating terminal', 'patrol'],
    },
  ],
  sceneSettings: [
    {
      id: 'wasteland',
      name: 'Wasteland',
      environmentDescriptors: ['barren desert', 'ruined highways', 'dead trees', 'abandoned cars'],
      lighting: ['harsh sunlight', 'dust haze', 'radioactive glow', 'sunset orange'],
      atmosphere: ['desolate', 'dangerous', 'hopeless', 'survival'],
      props: ['rusted cars', 'road signs', 'skeletons', 'tumbleweeds'],
    },
    {
      id: 'vault',
      name: 'Vault',
      environmentDescriptors: ['underground bunker', 'retro-futuristic design', 'clean corridors', 'vault door'],
      lighting: ['fluorescent lights', 'emergency lighting', 'computer screens', 'vault-tec yellow'],
      atmosphere: ['isolated', 'sterile', 'safe but confining', 'retro'],
      props: ['vault door', 'terminals', 'cryopods', 'vault-tec posters'],
    },
    {
      id: 'ruins',
      name: 'Urban Ruins',
      environmentDescriptors: ['collapsed buildings', 'overgrown streets', 'destroyed city', 'raiders territory'],
      lighting: ['broken windows', 'fire barrels', 'dim interior', 'dust particles'],
      atmosphere: ['dangerous', 'scavengeable', 'haunted', 'territorial'],
      props: ['rubble', 'makeshift barricades', 'raider totems', 'scrap piles'],
    },
  ],
  promptModifiers: {
    quality: 'highly detailed, post-apocalyptic realism, cinematic wasteland photography',
    style: 'fallout game aesthetic, 1950s retro-futurism, mad max influence, atomic age',
    atmosphere: 'dust particles, radioactive haze, golden hour wasteland, survival mood',
    negative: 'clean environments, modern technology, lush vegetation, bright colors',
  },
};

export const MEDIEVAL_THEME: RPGThemeConfig = {
  id: 'medieval',
  name: 'Medieval',
  description: 'Knights, castles, and courtly intrigue',
  defaultArtStyle: 'realistic',
  colorPalette: {
    primary: ['#8b4513', '#654321', '#3d2914'],
    secondary: ['#daa520', '#b8860b', '#cd853f'],
    accent: ['#8b0000', '#00008b', '#006400'],
    mood: 'warm earth tones, rich heraldic colors',
  },
  visualStyle: 'medieval historical, castles and keeps, feudal society, crusader era, authentic period detail',
  characterArchetypes: [
    {
      id: 'knight',
      name: 'Knight',
      visualDescriptors: ['noble bearing', 'battle-tested', 'honor-bound', 'chivalrous'],
      attire: ['full plate armor', 'tabard with heraldry', 'chainmail', 'knight helm'],
      accessories: ['longsword', 'kite shield', 'war horse', 'family crest'],
      poses: ['mounted charge', 'kneeling oath', 'combat stance', 'tournament joust'],
    },
    {
      id: 'noble',
      name: 'Noble',
      visualDescriptors: ['refined features', 'aristocratic bearing', 'wealthy appearance', 'political'],
      attire: ['fine robes', 'velvet doublet', 'ermine trim', 'noble attire'],
      accessories: ['signet ring', 'jeweled dagger', 'crown/coronet', 'scrolls'],
      poses: ['seated on throne', 'addressing court', 'plotting', 'formal portrait'],
    },
    {
      id: 'peasant',
      name: 'Commoner',
      visualDescriptors: ['weathered features', 'hardworking', 'humble', 'practical'],
      attire: ['rough-spun clothes', 'leather apron', 'simple tunic', 'patched clothing'],
      accessories: ['farming tools', 'basket', 'simple knife', 'worn shoes'],
      poses: ['working fields', 'market selling', 'bowing', 'tavern scene'],
    },
  ],
  sceneSettings: [
    {
      id: 'castle-hall',
      name: 'Great Hall',
      environmentDescriptors: ['vaulted ceilings', 'long tables', 'roaring fireplace', 'stone walls'],
      lighting: ['torchlight', 'fireplace glow', 'candlelit', 'window light'],
      atmosphere: ['grand', 'feudal', 'historic', 'powerful'],
      props: ['banners', 'throne', 'feasting tables', 'hunting trophies'],
    },
    {
      id: 'village',
      name: 'Medieval Village',
      environmentDescriptors: ['thatched cottages', 'muddy streets', 'market square', 'church steeple'],
      lighting: ['natural daylight', 'cooking fires', 'lanterns', 'overcast'],
      atmosphere: ['bustling', 'peasant life', 'community', 'hardship'],
      props: ['market stalls', 'well', 'stocks', 'animal pens'],
    },
    {
      id: 'battlefield',
      name: 'Medieval Battlefield',
      environmentDescriptors: ['open field', 'siege equipment', 'banners flying', 'formations'],
      lighting: ['dramatic sky', 'dust clouds', 'fire and smoke', 'golden hour'],
      atmosphere: ['chaotic', 'violent', 'epic', 'decisive'],
      props: ['trebuchets', 'war tents', 'fallen soldiers', 'siege towers'],
    },
  ],
  promptModifiers: {
    quality: 'historically accurate, detailed medieval illustration, museum quality',
    style: 'medieval historical art, illuminated manuscript influence, period authentic',
    atmosphere: 'torch-lit, stone and timber, feudal grandeur, authentic period mood',
    negative: 'modern elements, fantasy magic, bright colors, clean environments',
  },
};

export const SCIFI_THEME: RPGThemeConfig = {
  id: 'scifi',
  name: 'Sci-Fi',
  description: 'Space exploration, alien encounters, and interstellar adventure',
  defaultArtStyle: 'realistic',
  colorPalette: {
    primary: ['#1a1a2e', '#16213e', '#0f3460'],
    secondary: ['#e94560', '#00fff5', '#7b2cbf'],
    accent: ['#00ff88', '#ff6b35', '#ffd93d'],
    mood: 'deep space blues, technological highlights, alien accents',
  },
  visualStyle: 'science fiction, spacecraft interiors, alien worlds, advanced technology, space opera aesthetic',
  characterArchetypes: [
    {
      id: 'captain',
      name: 'Starship Captain',
      visualDescriptors: ['commanding presence', 'experienced', 'decisive', 'leadership aura'],
      attire: ['command uniform', 'rank insignia', 'duty jacket', 'formal uniform'],
      accessories: ['communicator', 'sidearm', 'captain\'s log', 'command codes'],
      poses: ['on bridge', 'giving orders', 'diplomatic stance', 'contemplating stars'],
    },
    {
      id: 'engineer',
      name: 'Ship Engineer',
      visualDescriptors: ['practical', 'problem-solver', 'tech-savvy', 'hands-on'],
      attire: ['engineering jumpsuit', 'utility belt', 'protective gear', 'work clothes'],
      accessories: ['multitool', 'scanner', 'repair kit', 'data tablet'],
      poses: ['repairing systems', 'analyzing readings', 'crawling jefferies tube', 'engine room'],
    },
    {
      id: 'alien',
      name: 'Alien Species',
      visualDescriptors: ['otherworldly features', 'unique physiology', 'distinct culture', 'exotic'],
      attire: ['species-specific garments', 'cultural dress', 'environmental suit', 'ceremonial'],
      accessories: ['alien technology', 'cultural artifacts', 'translation device', 'unique weapons'],
      poses: ['first contact', 'diplomatic gesture', 'combat stance', 'ceremonial'],
    },
  ],
  sceneSettings: [
    {
      id: 'bridge',
      name: 'Starship Bridge',
      environmentDescriptors: ['command center', 'viewscreen', 'control consoles', 'captain\'s chair'],
      lighting: ['console glow', 'viewscreen light', 'red alert', 'ambient ship lighting'],
      atmosphere: ['professional', 'tense', 'high-tech', 'military'],
      props: ['helm controls', 'tactical displays', 'communication array', 'captain\'s chair'],
    },
    {
      id: 'alien-world',
      name: 'Alien Planet',
      environmentDescriptors: ['exotic landscape', 'alien flora', 'strange sky', 'otherworldly'],
      lighting: ['alien sun', 'bioluminescence', 'multiple moons', 'atmospheric effects'],
      atmosphere: ['mysterious', 'dangerous', 'beautiful', 'unknown'],
      props: ['alien structures', 'strange creatures', 'landing craft', 'research equipment'],
    },
    {
      id: 'space-station',
      name: 'Space Station',
      environmentDescriptors: ['orbital platform', 'docking bays', 'commerce area', 'multi-species'],
      lighting: ['artificial lighting', 'starfield views', 'neon signs', 'diverse sources'],
      atmosphere: ['bustling', 'cosmopolitan', 'frontier', 'trading hub'],
      props: ['docked ships', 'cargo containers', 'alien vendors', 'promenade'],
    },
  ],
  promptModifiers: {
    quality: 'highly detailed sci-fi illustration, cinematic space opera, professional concept art',
    style: 'star trek influence, mass effect aesthetic, hard science fiction, space opera grandeur',
    atmosphere: 'deep space vastness, technological wonder, alien mystery, exploration spirit',
    negative: 'fantasy elements, medieval settings, earth-bound, primitive technology',
  },
};

// ============================================================
// THEME REGISTRY AND UTILITIES
// ============================================================

export const RPG_THEMES: Record<RPGTheme, RPGThemeConfig> = {
  cyberpunk: CYBERPUNK_THEME,
  fantasy: FANTASY_THEME,
  noir: NOIR_THEME,
  fallout: FALLOUT_THEME,
  medieval: MEDIEVAL_THEME,
  scifi: SCIFI_THEME,
};

/**
 * Get a complete theme configuration by ID
 */
export function getThemeConfig(theme: RPGTheme): RPGThemeConfig {
  return RPG_THEMES[theme];
}

/**
 * Get a random character archetype for a theme
 */
export function getRandomArchetype(theme: RPGTheme): CharacterArchetype {
  const config = RPG_THEMES[theme];
  const archetypes = config.characterArchetypes;
  return archetypes[Math.floor(Math.random() * archetypes.length)];
}

/**
 * Get a random scene setting for a theme
 */
export function getRandomSceneSetting(theme: RPGTheme): SceneSetting {
  const config = RPG_THEMES[theme];
  const settings = config.sceneSettings;
  return settings[Math.floor(Math.random() * settings.length)];
}

/**
 * Build a character portrait prompt using theme data
 */
export function buildCharacterPrompt(
  theme: RPGTheme,
  characterName: string,
  archetypeId?: string,
  customDescription?: string
): string {
  const config = RPG_THEMES[theme];
  const archetype = archetypeId
    ? config.characterArchetypes.find(a => a.id === archetypeId) || getRandomArchetype(theme)
    : getRandomArchetype(theme);

  const visualDescriptor = archetype.visualDescriptors[Math.floor(Math.random() * archetype.visualDescriptors.length)];
  const attire = archetype.attire[Math.floor(Math.random() * archetype.attire.length)];
  const accessory = archetype.accessories[Math.floor(Math.random() * archetype.accessories.length)];
  const pose = archetype.poses[Math.floor(Math.random() * archetype.poses.length)];

  const parts = [
    `Portrait of ${characterName}`,
    customDescription || `a ${archetype.name}`,
    visualDescriptor,
    `wearing ${attire}`,
    `with ${accessory}`,
    pose,
    config.visualStyle,
    config.promptModifiers.quality,
    config.promptModifiers.style,
  ];

  return parts.join(', ');
}

/**
 * Build a scene/background prompt using theme data
 */
export function buildScenePrompt(
  theme: RPGTheme,
  settingId?: string,
  customDescription?: string
): string {
  const config = RPG_THEMES[theme];
  const setting = settingId
    ? config.sceneSettings.find(s => s.id === settingId) || getRandomSceneSetting(theme)
    : getRandomSceneSetting(theme);

  const environment = setting.environmentDescriptors[Math.floor(Math.random() * setting.environmentDescriptors.length)];
  const lighting = setting.lighting[Math.floor(Math.random() * setting.lighting.length)];
  const atmosphere = setting.atmosphere[Math.floor(Math.random() * setting.atmosphere.length)];
  const prop = setting.props[Math.floor(Math.random() * setting.props.length)];

  const parts = [
    customDescription || setting.name,
    environment,
    `${lighting} lighting`,
    `${atmosphere} atmosphere`,
    `featuring ${prop}`,
    config.visualStyle,
    config.promptModifiers.quality,
    config.promptModifiers.atmosphere,
  ];

  return parts.join(', ');
}

/**
 * Get the recommended image dimensions for a category
 */
export function getImageDimensions(category: ImageCategory): { width: number; height: number } {
  const dimensions: Record<ImageCategory, { width: number; height: number }> = {
    character: { width: 1024, height: 1024 },
    scene: { width: 1024, height: 576 },
    background: { width: 1024, height: 576 },
    item: { width: 512, height: 512 },
    action: { width: 1024, height: 768 },
  };
  return dimensions[category];
}

/**
 * Get the negative prompt for a theme (things to avoid in generation)
 */
export function getNegativePrompt(theme: RPGTheme): string {
  return RPG_THEMES[theme].promptModifiers.negative;
}
