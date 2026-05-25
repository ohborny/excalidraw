import { EDITOR_LS_KEYS, cloneJSON, randomId } from "@excalidraw/common";

import {
  deepCopyElement,
  duplicateElements,
  getCommonBoundingBox,
} from "@excalidraw/element";

import type { ExcalidrawElement, NonDeleted } from "@excalidraw/element/types";

import { atom } from "../../editor-jotai";
import { EditorLocalStorage } from "../EditorLocalStorage";
import { restoreElements } from "../restore";

import { BUILTIN_SHAPE_TEMPLATES } from "./defaults";

import type {
  ExportedShapeTemplatesData,
  ShapeTemplate,
  ShapeTemplates,
} from "./types";

export type {
  ExportedShapeTemplatesData,
  ExcalidrawShapeTemplateIds,
  ShapeTemplate,
  ShapeTemplates,
} from "./types";

export { BUILTIN_SHAPE_TEMPLATES } from "./defaults";

export const SHAPE_TEMPLATES_FILE_TYPE = "excalidraw-shape-templates";
export const SHAPE_TEMPLATES_VERSION = 1;

export const shapeTemplatesAtom = atom<{
  customTemplates: ShapeTemplates;
}>({ customTemplates: [] });

export const normalizeShapeTemplateElements = (
  elements: readonly NonDeleted<ExcalidrawElement>[],
): NonDeleted<ExcalidrawElement>[] => {
  if (!elements.length) {
    return [];
  }
  const { minX, minY } = getCommonBoundingBox(elements);
  return elements.map((element) =>
    deepCopyElement({
      ...element,
      x: element.x - minX,
      y: element.y - minY,
    }),
  );
};

export const createShapeTemplateFromElements = (
  elements: readonly NonDeleted<ExcalidrawElement>[],
  name?: string,
): ShapeTemplate => ({
  id: randomId(),
  name: name || "Untitled template",
  created: Date.now(),
  elements: normalizeShapeTemplateElements(elements),
});

export const getShapeTemplatesForInstantiation = (
  templates: ShapeTemplates,
): NonDeleted<ExcalidrawElement>[] => {
  return templates.flatMap(
    (template) =>
      duplicateElements({
        type: "everything",
        elements: template.elements,
        randomizeSeed: true,
        preserveFrameChildrenOrder: true,
      }).duplicatedElements,
  ) as NonDeleted<ExcalidrawElement>[];
};

export const getAllShapeTemplates = (
  customTemplates: ShapeTemplates,
): ShapeTemplates => [...BUILTIN_SHAPE_TEMPLATES, ...customTemplates];

export const loadCustomShapeTemplates = (): ShapeTemplates => {
  const data = EditorLocalStorage.get<ExportedShapeTemplatesData>(
    EDITOR_LS_KEYS.SHAPE_TEMPLATES,
  );
  if (!data?.templates?.length) {
    return [];
  }
  return data.templates.map((template) => ({
    ...template,
    elements: restoreElements(
      template.elements,
      null,
    ) as NonDeleted<ExcalidrawElement>[],
  }));
};

export const saveCustomShapeTemplates = (templates: ShapeTemplates): void => {
  const data: ExportedShapeTemplatesData = {
    type: SHAPE_TEMPLATES_FILE_TYPE,
    version: SHAPE_TEMPLATES_VERSION,
    templates: cloneJSON(templates),
  };
  EditorLocalStorage.set(EDITOR_LS_KEYS.SHAPE_TEMPLATES, data);
};

export const parseShapeTemplatesJSON = (
  json: string,
): ShapeTemplates | null => {
  try {
    const data = JSON.parse(json);
    if (data?.type === SHAPE_TEMPLATES_FILE_TYPE && data.templates) {
      return data.templates.map((template: ShapeTemplate) => ({
        ...template,
        elements: restoreElements(
          template.elements,
          null,
        ) as NonDeleted<ExcalidrawElement>[],
      }));
    }
    if (Array.isArray(data?.templates)) {
      return data.templates;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

export const serializeShapeTemplatesAsJSON = (
  templates: ShapeTemplates,
): string => {
  const data: ExportedShapeTemplatesData = {
    type: SHAPE_TEMPLATES_FILE_TYPE,
    version: SHAPE_TEMPLATES_VERSION,
    templates,
  };
  return JSON.stringify(data);
};

export const filterShapeTemplatesByIds = (
  allTemplates: ShapeTemplates,
  templateIds: ShapeTemplate["id"][],
): ShapeTemplates =>
  allTemplates.filter((template) => templateIds.includes(template.id));
