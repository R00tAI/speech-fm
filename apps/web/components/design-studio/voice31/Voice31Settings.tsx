"use client";

/**
 * Voice31Settings
 *
 * Previously a fullscreen modal overlay. Settings are now rendered
 * inline in the sidebar via SidebarSettingsPanel.
 * This component is kept as a no-op for backward compatibility
 * (it's still referenced in Voice31Display.tsx).
 */

import type React from "react";

export const Voice31Settings: React.FC = () => {
  // Settings UI has moved to the sidebar (SidebarSettingsPanel).
  // This component is intentionally empty.
  return null;
};

export default Voice31Settings;
