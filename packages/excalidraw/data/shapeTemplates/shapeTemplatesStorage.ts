import { EDITOR_LS_KEYS } from "@excalidraw/common";

import { EditorLocalStorage } from "../EditorLocalStorage";

import type { ShapeTemplate } from "./types";

export const loadCustomShapeTemplates = (): ShapeTemplate[] => {
  const stored = EditorLocalStorage.get<ShapeTemplate[]>(
    EDITOR_LS_KEYS.CUSTOM_SHAPE_TEMPLATES,
  );
  if (!stored || !Array.isArray(stored)) {
    return [];
  }
  return stored;
};

export const saveCustomShapeTemplates = (templates: ShapeTemplate[]): void => {
  EditorLocalStorage.set(EDITOR_LS_KEYS.CUSTOM_SHAPE_TEMPLATES, templates);
};
