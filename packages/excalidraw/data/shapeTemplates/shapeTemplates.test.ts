import { beforeEach, describe, expect, it } from "vitest";

import { EDITOR_LS_KEYS } from "@excalidraw/common";

import { getCommonBounds } from "@excalidraw/element";

import { newElement } from "@excalidraw/element";

import type { ExcalidrawImageElement } from "@excalidraw/element/types";

import { EditorLocalStorage } from "../EditorLocalStorage";

import {
  exportSelectionAsShapeTemplate,
  getShapeTemplateById,
  getShapeTemplates,
  getShapeTemplatesByIds,
  getUserShapeTemplates,
  instantiateShapeTemplate,
  normalizeTemplateElements,
  parseShapeTemplatesFile,
  registerShapeTemplates,
  removeShapeTemplate,
  resetCustomShapeTemplates,
} from "./shapeTemplates";
import {
  loadCustomShapeTemplates,
  saveCustomShapeTemplates,
} from "./shapeTemplatesStorage";
import {
  SHAPE_TEMPLATES_FILE_TYPE,
  SHAPE_TEMPLATES_VERSION,
  type ShapeTemplatesFile,
} from "./types";

describe("shapeTemplates", () => {
  beforeEach(() => {
    resetCustomShapeTemplates();
    EditorLocalStorage.delete(EDITOR_LS_KEYS.CUSTOM_SHAPE_TEMPLATES);
  });

  it("parses a valid shape templates file", () => {
    const file: ShapeTemplatesFile = {
      type: SHAPE_TEMPLATES_FILE_TYPE,
      version: SHAPE_TEMPLATES_VERSION,
      templates: [
        {
          id: "custom-box",
          name: "Custom box",
          elements: [
            { type: "rectangle", x: 10, y: 20, width: 50, height: 40 },
          ],
        },
      ],
    };
    const parsed = parseShapeTemplatesFile(JSON.stringify(file));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("custom-box");
  });

  it("rejects invalid shape templates file", () => {
    expect(() => parseShapeTemplatesFile("{}")).toThrow(
      "Invalid shape templates file",
    );
  });

  it("normalizes template elements to origin", () => {
    const elements = normalizeTemplateElements([
      { type: "rectangle", x: 100, y: 200, width: 40, height: 30 },
      { type: "ellipse", x: 150, y: 250, width: 30, height: 30 },
    ]);
    const [minX, minY] = getCommonBounds(elements);
    expect(minX).toBe(0);
    expect(minY).toBe(0);
    expect(elements).toHaveLength(2);
  });

  it("instantiates grouped template preserving groupIds", () => {
    const elements = instantiateShapeTemplate(
      getShapeTemplateById("grouped-pair")!,
    );
    expect(elements).toHaveLength(2);
    expect(elements[0].groupIds).toEqual(elements[1].groupIds);
    expect(elements[0].groupIds.length).toBeGreaterThan(0);
  });

  it("registers custom templates", () => {
    registerShapeTemplates([
      {
        id: "host-template",
        name: "Host",
        elements: [{ type: "rectangle", x: 0, y: 0, width: 10, height: 10 }],
      },
    ]);
    expect(getShapeTemplateById("host-template")).toBeDefined();
    expect(getShapeTemplatesByIds(["host-template"])).toHaveLength(1);
  });

  it("exportSelectionAsShapeTemplate preserves groupIds and normalizes origin", () => {
    const rect1 = newElement({
      type: "rectangle",
      x: 100,
      y: 200,
      width: 40,
      height: 40,
      groupIds: ["export-group"],
    });
    const rect2 = newElement({
      type: "rectangle",
      x: 150,
      y: 200,
      width: 40,
      height: 40,
      groupIds: ["export-group"],
    });

    const template = exportSelectionAsShapeTemplate([rect1, rect2], {
      name: "Grouped export",
    });

    expect(template.elements).toHaveLength(2);
    expect(template.elements[0].groupIds).toEqual(["export-group"]);
    expect(template.elements[1].groupIds).toEqual(["export-group"]);

    const [minX, minY] = getCommonBounds(
      instantiateShapeTemplate(template),
    );
    expect(minX).toBe(0);
    expect(minY).toBe(0);
  });

  it("rejects export when selection includes disabled types", () => {
    const image = {
      ...newElement({ type: "rectangle", x: 0, y: 0, width: 100, height: 100 }),
      type: "image",
      fileId: "file1",
    } as ExcalidrawImageElement;

    expect(() =>
      exportSelectionAsShapeTemplate([image], { name: "Bad" }),
    ).toThrow("errors.libraryElementTypeError.image");
  });

  it("persists custom templates to local storage", () => {
    registerShapeTemplates([
      {
        id: "stored-template",
        name: "Stored",
        elements: [{ type: "rectangle", x: 0, y: 0, width: 10, height: 10 }],
      },
    ]);

    expect(loadCustomShapeTemplates()).toHaveLength(1);
    expect(loadCustomShapeTemplates()[0].id).toBe("stored-template");
  });

  it("removeShapeTemplate updates storage", () => {
    saveCustomShapeTemplates([
      {
        id: "to-remove",
        name: "Remove me",
        elements: [{ type: "rectangle", x: 0, y: 0, width: 10, height: 10 }],
      },
    ]);
    resetCustomShapeTemplates();
    registerShapeTemplates([
      {
        id: "to-remove",
        name: "Remove me",
        elements: [{ type: "rectangle", x: 0, y: 0, width: 10, height: 10 }],
      },
      {
        id: "to-keep",
        name: "Keep me",
        elements: [{ type: "rectangle", x: 0, y: 0, width: 10, height: 10 }],
      },
    ]);

    removeShapeTemplate("to-remove");

    expect(getUserShapeTemplates()).toHaveLength(1);
    expect(getUserShapeTemplates()[0].id).toBe("to-keep");
    expect(loadCustomShapeTemplates()).toHaveLength(1);
    expect(getShapeTemplates().some((t) => t.id === "to-remove")).toBe(false);
  });
});
