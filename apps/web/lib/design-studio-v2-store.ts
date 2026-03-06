/**
 * Design Studio V2 Store — Stub for Speech FM standalone
 *
 * Voice31Tools dynamically imports this for adding elements to the design canvas.
 * Since Speech FM runs standalone (no design studio), this is a no-op stub.
 */

import { create } from "zustand";

export interface DesignElement {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
}

interface DesignStudioV2Store {
  project: {
    elements: DesignElement[];
  };
  addElement: (type: string) => void;
}

export const useDesignStudioV2Store = create<DesignStudioV2Store>(() => ({
  project: {
    elements: [],
  },
  addElement: () => {
    // No-op in standalone Speech FM
  },
}));
