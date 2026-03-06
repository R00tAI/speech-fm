// Theme configuration for consistent styling across the app
// NO AI GRADIENTS - Professional, accessible color palettes only

export const themes = {
  // Professional dark theme
  dark: {
    name: 'Dark',
    background: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a', 
      tertiary: '#2a2a2a',
      overlay: 'rgba(0, 0, 0, 0.7)'
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
      muted: '#666666'
    },
    accent: {
      primary: '#10b981', // Emerald
      secondary: '#f97316', // Orange
      tertiary: '#8b5cf6', // Violet
      danger: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981'
    },
    border: '#333333'
  },
  
  // Clean light theme
  light: {
    name: 'Light',
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      overlay: 'rgba(255, 255, 255, 0.9)'
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      muted: '#9ca3af'
    },
    accent: {
      primary: '#059669', // Emerald
      secondary: '#ea580c', // Orange
      tertiary: '#7c3aed', // Violet
      danger: '#dc2626',
      warning: '#d97706',
      success: '#059669'
    },
    border: '#e5e7eb'
  },
  
  // Calm theme for reduced stress
  calm: {
    name: 'Calm',
    background: {
      primary: '#f0f9ff',
      secondary: '#e0f2fe',
      tertiary: '#bae6fd',
      overlay: 'rgba(240, 249, 255, 0.95)'
    },
    text: {
      primary: '#0c4a6e',
      secondary: '#0284c7',
      muted: '#38bdf8'
    },
    accent: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      tertiary: '#22d3ee',
      danger: '#f87171',
      warning: '#fbbf24',
      success: '#34d399'
    },
    border: '#7dd3fc'
  },
  
  // Energetic theme for engagement
  energetic: {
    name: 'Energetic',
    background: {
      primary: '#fef3c7',
      secondary: '#fde68a',
      tertiary: '#fcd34d',
      overlay: 'rgba(254, 243, 199, 0.95)'
    },
    text: {
      primary: '#78350f',
      secondary: '#92400e',
      muted: '#b45309'
    },
    accent: {
      primary: '#f59e0b',
      secondary: '#f97316',
      tertiary: '#fb923c',
      danger: '#ef4444',
      warning: '#eab308',
      success: '#22c55e'
    },
    border: '#fbbf24'
  },
  
  // Focus theme for concentration
  focus: {
    name: 'Focus',
    background: {
      primary: '#1e1b4b',
      secondary: '#312e81',
      tertiary: '#3730a3',
      overlay: 'rgba(30, 27, 75, 0.95)'
    },
    text: {
      primary: '#e0e7ff',
      secondary: '#c7d2fe',
      muted: '#a5b4fc'
    },
    accent: {
      primary: '#6366f1',
      secondary: '#818cf8',
      tertiary: '#a5b4fc',
      danger: '#f87171',
      warning: '#fbbf24',
      success: '#4ade80'
    },
    border: '#4f46e5'
  }
}

// Paper shader background configurations (non-AI patterns)
export const backgroundShaders = {
  organic: {
    colors: ['#10b981', '#f97316', '#8b5cf6', '#06b6d4'],
    distortion: 0.4,
    swirl: 0.3,
    speed: 0.15
  },
  warm: {
    colors: ['#f97316', '#fbbf24', '#fb923c', '#fed7aa'],
    distortion: 0.3,
    swirl: 0.2,
    speed: 0.1
  },
  cool: {
    colors: ['#06b6d4', '#0ea5e9', '#38bdf8', '#7dd3fc'],
    distortion: 0.35,
    swirl: 0.25,
    speed: 0.12
  },
  earth: {
    colors: ['#a16207', '#ca8a04', '#eab308', '#fde047'],
    distortion: 0.25,
    swirl: 0.15,
    speed: 0.08
  },
  forest: {
    colors: ['#14532d', '#166534', '#15803d', '#16a34a'],
    distortion: 0.3,
    swirl: 0.2,
    speed: 0.1
  }
}

// Get theme by name
export const getTheme = (themeName: keyof typeof themes) => {
  return themes[themeName] || themes.dark
}

// Apply theme to CSS variables
export const applyTheme = (themeName: keyof typeof themes) => {
  const theme = getTheme(themeName)
  const root = document.documentElement
  
  // Set CSS variables
  root.style.setProperty('--bg-primary', theme.background.primary)
  root.style.setProperty('--bg-secondary', theme.background.secondary)
  root.style.setProperty('--bg-tertiary', theme.background.tertiary)
  root.style.setProperty('--text-primary', theme.text.primary)
  root.style.setProperty('--text-secondary', theme.text.secondary)
  root.style.setProperty('--text-muted', theme.text.muted)
  root.style.setProperty('--accent-primary', theme.accent.primary)
  root.style.setProperty('--accent-secondary', theme.accent.secondary)
  root.style.setProperty('--accent-tertiary', theme.accent.tertiary)
  root.style.setProperty('--border', theme.border)
}