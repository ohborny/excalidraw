import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { API } from "@excalidraw/excalidraw/tests/helpers/api";

import { getStarPoints } from "../src/bounds";
import { ShapeCache } from "../src/shape";

import type { ExcalidrawStarElement } from "../src/types";

const currentDir = dirname(fileURLToPath(import.meta.url));

const readElementSource = (fileName: string) =>
  readFileSync(join(currentDir, "../src", fileName), "utf8");

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

  it("keeps star side construction in a single shared helper", () => {
    const helperDefinitions = [
      "bounds.ts",
      "collision.ts",
      "distance.ts",
    ].flatMap((fileName) =>
      Array.from(
        readElementSource(fileName).matchAll(
          /\b(?:export\s+)?const\s+getStarElementSides\s*=/g,
        ),
      ),
    );

    expect(helperDefinitions).toHaveLength(1);
  });
});
