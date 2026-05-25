import { describe, expect, it, beforeEach } from "vitest";

import { getCommonBounds } from "@excalidraw/element";

import {
  getShapeTemplateById,
  getShapeTemplatesByIds,
  instantiateShapeTemplate,
  normalizeTemplateElements,
  parseShapeTemplatesFile,
  registerShapeTemplates,
  resetCustomShapeTemplates,
} from "./shapeTemplates";
import {
  SHAPE_TEMPLATES_FILE_TYPE,
  SHAPE_TEMPLATES_VERSION,
  type ShapeTemplatesFile,
} from "./types";

describe("shapeTemplates", () => {
  beforeEach(() => {
    resetCustomShapeTemplates();
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
});
