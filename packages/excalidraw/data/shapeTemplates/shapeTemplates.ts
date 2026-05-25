import {
  convertToExcalidrawElements,
  getCommonBounds,
  newElementWith,
} from "@excalidraw/element";

import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/element";

import { DEFAULT_SHAPE_TEMPLATES } from "./defaultTemplates";
import {
  SHAPE_TEMPLATES_FILE_TYPE,
  SHAPE_TEMPLATES_VERSION,
  type ShapeTemplate,
  type ShapeTemplateElement,
  type ShapeTemplatesFile,
} from "./types";

let customShapeTemplates: ShapeTemplate[] = [];

export const getShapeTemplates = (): ShapeTemplate[] => [
  ...DEFAULT_SHAPE_TEMPLATES,
  ...customShapeTemplates,
];

export const getShapeTemplateById = (
  id: ShapeTemplate["id"],
): ShapeTemplate | undefined =>
  getShapeTemplates().find((template) => template.id === id);

export const registerShapeTemplates = (templates: ShapeTemplate[]): void => {
  customShapeTemplates = [...customShapeTemplates, ...templates];
};

export const resetCustomShapeTemplates = (): void => {
  customShapeTemplates = [];
};

export const isShapeTemplatesFile = (
  data: unknown,
): data is ShapeTemplatesFile => {
  if (!data || typeof data !== "object") {
    return false;
  }
  const file = data as ShapeTemplatesFile;
  return (
    file.type === SHAPE_TEMPLATES_FILE_TYPE &&
    typeof file.version === "number" &&
    Array.isArray(file.templates)
  );
};

export const parseShapeTemplatesFile = (json: string): ShapeTemplate[] => {
  const data = JSON.parse(json);
  if (!isShapeTemplatesFile(data)) {
    throw new Error("Invalid shape templates file");
  }
  if (data.version > SHAPE_TEMPLATES_VERSION) {
    throw new Error("Unsupported shape templates file version");
  }
  return validateShapeTemplates(data.templates);
};

const validateShapeTemplates = (templates: unknown): ShapeTemplate[] => {
  if (!Array.isArray(templates)) {
    throw new Error("Invalid shape templates: expected array");
  }
  return templates.map((template, index) => {
    if (!template || typeof template !== "object") {
      throw new Error(`Invalid shape template at index ${index}`);
    }
    const { id, name, elements } = template as ShapeTemplate;
    if (typeof id !== "string" || !id) {
      throw new Error(`Invalid shape template id at index ${index}`);
    }
    if (typeof name !== "string" || !name) {
      throw new Error(`Invalid shape template name at index ${index}`);
    }
    if (!Array.isArray(elements) || elements.length === 0) {
      throw new Error(`Invalid shape template elements at index ${index}`);
    }
    return template as ShapeTemplate;
  });
};

/** Normalize element positions so the template bounding box starts at (0, 0). */
export const normalizeTemplateElements = (
  elements: readonly ShapeTemplateElement[],
): ExcalidrawElement[] => {
  const converted = convertToExcalidrawElements(
    elements as ExcalidrawElementSkeleton[],
    { regenerateIds: true },
  );
  if (converted.length === 0) {
    return [];
  }
  const [minX, minY] = getCommonBounds(converted);
  return converted.map((element) =>
    newElementWith(element, {
      x: element.x - minX,
      y: element.y - minY,
    }),
  );
};

/** Instantiate a template into canvas-ready elements (relative to origin). */
export const instantiateShapeTemplate = (
  template: ShapeTemplate,
): ExcalidrawElement[] => normalizeTemplateElements(template.elements);

export const getShapeTemplatesByIds = (
  ids: ShapeTemplate["id"][],
): ShapeTemplate[] => {
  const templates = getShapeTemplates();
  return ids
    .map((id) => templates.find((template) => template.id === id))
    .filter((template): template is ShapeTemplate => !!template);
};

export const instantiateShapeTemplates = (
  templates: ShapeTemplate[],
): ExcalidrawElement[] =>
  templates.flatMap((template) => instantiateShapeTemplate(template));
