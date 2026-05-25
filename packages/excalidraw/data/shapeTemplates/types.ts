import type { ExcalidrawElement, NonDeleted } from "@excalidraw/element/types";

export type ShapeTemplate = {
  id: string;
  name: string;
  elements: readonly NonDeleted<ExcalidrawElement>[];
  /** timestamp in epoch (ms) */
  created?: number;
  builtin?: boolean;
};

export type ShapeTemplates = readonly ShapeTemplate[];

export type ExportedShapeTemplatesData = {
  type: "excalidraw-shape-templates";
  version: 1;
  templates: ShapeTemplates;
};

export type ExcalidrawShapeTemplateIds = {
  templateIds: ShapeTemplate["id"][];
};
