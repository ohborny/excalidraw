import type { ExcalidrawElementSkeleton } from "@excalidraw/element";

export const SHAPE_TEMPLATES_FILE_TYPE = "excalidraw/shape-templates" as const;
export const SHAPE_TEMPLATES_VERSION = 1;

/** Element partial with position relative to the template origin (top-left of bounds). */
export type ShapeTemplateElement = ExcalidrawElementSkeleton;

export type ShapeTemplate = {
  /** Unique template identifier */
  id: string;
  /** Display name in the templates panel */
  name: string;
  /** Optional short description */
  description?: string;
  /** Elements making up the template, using relative coordinates */
  elements: readonly ShapeTemplateElement[];
};

export type ShapeTemplatesFile = {
  type: typeof SHAPE_TEMPLATES_FILE_TYPE;
  version: number;
  templates: ShapeTemplate[];
};

export type ExcalidrawTemplateIds = {
  templateIds: ShapeTemplate["id"][];
};
