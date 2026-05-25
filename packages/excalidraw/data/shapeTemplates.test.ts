import { describe, expect, it } from "vitest";

import { API } from "../tests/helpers/api";

import {
  createShapeTemplateFromElements,
  filterShapeTemplatesByIds,
  getShapeTemplatesForInstantiation,
  normalizeShapeTemplateElements,
  parseShapeTemplatesJSON,
  serializeShapeTemplatesAsJSON,
} from "./shapeTemplates";

describe("shapeTemplates", () => {
  it("normalizeShapeTemplateElements shifts elements to origin", () => {
    const rect = API.createElement({
      type: "rectangle",
      x: 100,
      y: 200,
      width: 50,
      height: 50,
    });
    const normalized = normalizeShapeTemplateElements([rect]);
    expect(normalized[0].x).toBe(0);
    expect(normalized[0].y).toBe(0);
  });

  it("createShapeTemplateFromElements preserves groupIds", () => {
    const groupId = "group1";
    const rect1 = API.createElement({
      type: "rectangle",
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      groupIds: [groupId],
    });
    const rect2 = API.createElement({
      type: "rectangle",
      x: 50,
      y: 0,
      width: 40,
      height: 40,
      groupIds: [groupId],
    });
    const template = createShapeTemplateFromElements([rect1, rect2]);
    expect(template.elements[0].groupIds).toEqual([groupId]);
    expect(template.elements[1].groupIds).toEqual([groupId]);
  });

  it("getShapeTemplatesForInstantiation regenerates ids", () => {
    const rect = API.createElement({
      type: "rectangle",
      id: "rect1",
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });
    const template = createShapeTemplateFromElements([rect]);
    const instantiated = getShapeTemplatesForInstantiation([template]);
    expect(instantiated[0].id).not.toBe("rect1");
  });

  it("parseShapeTemplatesJSON and serialize roundtrip", () => {
    const rect = API.createElement({
      type: "rectangle",
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });
    const template = createShapeTemplateFromElements([rect], "Test");
    const json = serializeShapeTemplatesAsJSON([template]);
    const parsed = parseShapeTemplatesJSON(json);
    expect(parsed).toHaveLength(1);
    expect(parsed![0].name).toBe("Test");
    expect(parsed![0].elements[0].type).toBe("rectangle");
  });

  it("filterShapeTemplatesByIds", () => {
    const templates = [
      createShapeTemplateFromElements([
        API.createElement({
          type: "rectangle",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
        }),
      ]),
      createShapeTemplateFromElements([
        API.createElement({
          type: "ellipse",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
        }),
      ]),
    ];
    const filtered = filterShapeTemplatesByIds(templates, [templates[0].id]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(templates[0].id);
  });
});
