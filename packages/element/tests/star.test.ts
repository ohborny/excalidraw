import { API } from "@excalidraw/excalidraw/tests/helpers/api";

import { getStarPoints } from "../src/bounds";
import { ShapeCache } from "../src/shape";

import type { ExcalidrawStarElement } from "../src/types";

describe("star element", () => {
  it("getStarPoints returns 10 vertices for a pentagram", () => {
    const element = API.createElement({
      type: "star",
      width: 100,
      height: 80,
    });

    const points = getStarPoints(element);

    expect(points).toHaveLength(10);
    expect(points[0][1]).toBeCloseTo(0, 1);
    expect(points[0][0]).toBeCloseTo(50, 0);
  });

  it("ShapeCache generates a drawable star shape", () => {
    const element = API.createElement({
      type: "star",
      width: 60,
      height: 60,
    });

    const shape = ShapeCache.generateElementShape(
      element as ExcalidrawStarElement,
      null,
    );

    expect(shape).toBeDefined();
    expect(shape).not.toBeNull();
    expect(Array.isArray(shape) ? shape.length : 1).toBeGreaterThan(0);
  });
});
