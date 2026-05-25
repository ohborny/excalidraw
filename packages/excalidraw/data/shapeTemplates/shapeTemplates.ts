import {
  LIBRARY_DISABLED_TYPES,
  randomId,
} from "@excalidraw/common";

import {
  convertToExcalidrawElements,
  deepCopyElement,
  getCommonBounds,
  newElementWith,
} from "@excalidraw/element";

import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/element";

import { atom, editorJotaiStore } from "../../editor-jotai";

import { DEFAULT_SHAPE_TEMPLATES } from "./defaultTemplates";
import {
  loadCustomShapeTemplates,
  saveCustomShapeTemplates,
} from "./shapeTemplatesStorage";
import {
  SHAPE_TEMPLATES_FILE_TYPE,
  SHAPE_TEMPLATES_VERSION,
  type ShapeTemplate,
  type ShapeTemplateElement,
  type ShapeTemplatesFile,
} from "./types";

let hostShapeTemplates: ShapeTemplate[] = [];
let userShapeTemplates: ShapeTemplate[] = [];

export const shapeTemplatesVersionAtom = atom(0);

const bumpShapeTemplatesVersion = () => {
  editorJotaiStore.set(shapeTemplatesVersionAtom, (version) => version + 1);
};

export const getShapeTemplates = (): ShapeTemplate[] => [
  ...DEFAULT_SHAPE_TEMPLATES,
  ...hostShapeTemplates,
  ...userShapeTemplates,
];

export const getUserShapeTemplates = (): ShapeTemplate[] => [
  ...userShapeTemplates,
];

export const getShapeTemplateById = (
  id: ShapeTemplate["id"],
): ShapeTemplate | undefined =>
  getShapeTemplates().find((template) => template.id === id);

export const loadUserShapeTemplatesFromStorage = (): void => {
  userShapeTemplates = loadCustomShapeTemplates();
};

export const setHostShapeTemplates = (templates: ShapeTemplate[]): void => {
  hostShapeTemplates = templates;
};

export const registerShapeTemplates = (templates: ShapeTemplate[]): void => {
  userShapeTemplates = [...userShapeTemplates, ...templates];
  saveCustomShapeTemplates(userShapeTemplates);
  bumpShapeTemplatesVersion();
};

export const removeShapeTemplate = (id: ShapeTemplate["id"]): void => {
  userShapeTemplates = userShapeTemplates.filter((template) => template.id !== id);
  saveCustomShapeTemplates(userShapeTemplates);
  bumpShapeTemplatesVersion();
};

export const resetCustomShapeTemplates = (): void => {
  hostShapeTemplates = [];
  userShapeTemplates = [];
  saveCustomShapeTemplates([]);
  bumpShapeTemplatesVersion();
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

const RUNTIME_ELEMENT_KEYS = new Set([
  "id",
  "version",
  "versionNonce",
  "seed",
  "index",
  "updated",
  "isDeleted",
  "link",
]);

export class ShapeTemplateExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShapeTemplateExportError";
  }
}

const elementToTemplateElement = (
  element: ExcalidrawElement,
  offset: { minX: number; minY: number },
  selectedIds: Set<ExcalidrawElement["id"]>,
): ShapeTemplateElement => {
  const copy = deepCopyElement(element);

  copy.x -= offset.minX;
  copy.y -= offset.minY;

  if ("startBinding" in copy && copy.startBinding) {
    if (!selectedIds.has(copy.startBinding.elementId)) {
      copy.startBinding = null;
    }
  }
  if ("endBinding" in copy && copy.endBinding) {
    if (!selectedIds.has(copy.endBinding.elementId)) {
      copy.endBinding = null;
    }
  }
  if ("frameId" in copy && copy.frameId && !selectedIds.has(copy.frameId)) {
    copy.frameId = null;
  }
  if (
    "containerId" in copy &&
    copy.containerId &&
    !selectedIds.has(copy.containerId)
  ) {
    copy.containerId = null;
  }

  const skeleton: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(copy)) {
    if (!RUNTIME_ELEMENT_KEYS.has(key) && value !== undefined) {
      skeleton[key] = value;
    }
  }

  return skeleton as ShapeTemplateElement;
};

export type ExportSelectionAsShapeTemplateOptions = {
  name: string;
};

export const exportSelectionAsShapeTemplate = (
  elements: readonly ExcalidrawElement[],
  options: ExportSelectionAsShapeTemplateOptions,
): ShapeTemplate => {
  if (!elements.length) {
    throw new ShapeTemplateExportError("No elements selected");
  }

  for (const type of LIBRARY_DISABLED_TYPES) {
    if (elements.some((element) => element.type === type)) {
      throw new ShapeTemplateExportError(
        `errors.libraryElementTypeError.${type}`,
      );
    }
  }

  const copied = elements.map((element) => deepCopyElement(element));
  const [minX, minY] = getCommonBounds(copied);
  const selectedIds = new Set(copied.map((element) => element.id));

  return {
    id: randomId(),
    name: options.name,
    elements: copied.map((element) =>
      elementToTemplateElement(element, { minX, minY }, selectedIds),
    ),
  };
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
