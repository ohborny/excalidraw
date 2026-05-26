import { describe, expect, it } from "vitest";

import type { Radians } from "@excalidraw/math";

import { newElement } from "../src/newElement";
import { ShapeCache } from "../src/shape";
import { getElementBounds, getStarPoints } from "../src/bounds";

import type { ExcalidrawStarElement } from "../src/types";

describe("getStarPoints", () => {
  it("returns 10 vertices within the element bounding box", () => {
    const element = newElement({
      type: "star",
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });

    const points = getStarPoints(element);

    expect(points).toHaveLength(10);
    for (const [px, py] of points) {
      expect(px).toBeGreaterThanOrEqual(0);
      expect(px).toBeLessThanOrEqual(element.width);
      expect(py).toBeGreaterThanOrEqual(0);
      expect(py).toBeLessThanOrEqual(element.height);
    }
  });
});

describe("ShapeCache.generateElementShape", () => {
  it("generates a rough.js polygon drawable for star elements", () => {
    const element = newElement({
      type: "star",
      x: 10,
      y: 20,
      width: 60,
      height: 50,
      strokeColor: "#000000",
      backgroundColor: "#ffc9c9",
    });

    const shape = ShapeCache.generateElementShape(
      element as ExcalidrawStarElement,
      null,
    );

    expect(shape).toBeDefined();
    expect(shape).toHaveProperty("sets");
  });
});

describe("getElementBounds", () => {
  it("star", () => {
    const element = newElement({
      type: "star",
      x: 40,
      y: 30,
      width: 20,
      height: 10,
      angle: (Math.PI / 4) as Radians,
    });

    const [x1, y1, x2, y2] = getElementBounds(element, new Map([[element.id, element]]));

    expect(x2 - x1).toBeGreaterThan(0);
    expect(y2 - y1).toBeGreaterThan(0);
    expect(x1).toBeLessThan(x2);
    expect(y1).toBeLessThan(y2);
  });
});
