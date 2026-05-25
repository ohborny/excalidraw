import { waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { MIME_TYPES } from "@excalidraw/common";

import { shapeTemplatesAtom } from "../data/shapeTemplates";
import { editorJotaiStore } from "../editor-jotai";
import { Excalidraw } from "../index";

import { API } from "./helpers/api";
import { render } from "./test-utils";

const { h } = window;

describe("shape templates inserting", () => {
  it("should insert grouped template on drop and preserve groupIds", async () => {
    const groupId = "test-group";
    await render(<Excalidraw />);

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

    editorJotaiStore.set(shapeTemplatesAtom, {
      customTemplates: [
        {
          id: "custom-grouped",
          name: "Grouped rects",
          elements: [rect1, rect2],
          created: Date.now(),
        },
      ],
    });

    await API.drop([
      {
        kind: "string",
        value: JSON.stringify({
          templateIds: ["custom-grouped"],
        }),
        type: MIME_TYPES.excalidrawShapeTemplateIds,
      },
    ]);

    await waitFor(() => {
      const rectangles = h.elements.filter((e) => e.type === "rectangle");
      expect(rectangles).toHaveLength(2);
      expect(rectangles[0].groupIds).toHaveLength(1);
      expect(rectangles[1].groupIds).toEqual(rectangles[0].groupIds);
      expect(rectangles[0].groupIds[0]).not.toBe(groupId);
    });
  });

  it("should insert builtin template on drop", async () => {
    await render(<Excalidraw />);

    await API.drop([
      {
        kind: "string",
        value: JSON.stringify({
          templateIds: ["builtin-process-box"],
        }),
        type: MIME_TYPES.excalidrawShapeTemplateIds,
      },
    ]);

    await waitFor(() => {
      expect(h.elements.some((e) => e.type === "rectangle")).toBe(true);
      expect(h.elements.some((e) => e.type === "text")).toBe(true);
    });
  });
});
