import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_SIDEBAR,
  MIME_TYPES,
  SHAPE_TEMPLATES_SIDEBAR_TAB,
} from "@excalidraw/common";

import { Excalidraw } from "../index";
import {
  getShapeTemplates,
  registerShapeTemplates,
  resetCustomShapeTemplates,
} from "../data/shapeTemplates/shapeTemplates";

import { API } from "./helpers/api";
import { render } from "./test-utils";

const { h } = window;

describe("shape templates", () => {
  beforeEach(async () => {
    resetCustomShapeTemplates();
    await render(<Excalidraw />);
  });

  it("inserts template via drag and drop preserving group", async () => {
    await API.drop([
      {
        kind: "string",
        value: JSON.stringify({ templateIds: ["grouped-pair"] }),
        type: MIME_TYPES.excalidrawTemplateIds,
      },
    ]);

    await waitFor(() => {
      const ellipses = h.elements.filter((e) => e.type === "ellipse");
      expect(ellipses).toHaveLength(2);
      expect(ellipses[0].groupIds).toEqual(ellipses[1].groupIds);
      expect(ellipses[0].groupIds.length).toBeGreaterThan(0);
    });
  });

  it("inserts custom grouped template added via registerShapeTemplates", async () => {
    registerShapeTemplates([
      {
        id: "custom-group",
        name: "Custom group",
        elements: [
          {
            type: "rectangle",
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            groupIds: ["custom-group-id"],
          },
          {
            type: "rectangle",
            x: 50,
            y: 0,
            width: 40,
            height: 40,
            groupIds: ["custom-group-id"],
          },
        ],
      },
    ]);

    await API.drop([
      {
        kind: "string",
        value: JSON.stringify({ templateIds: ["custom-group"] }),
        type: MIME_TYPES.excalidrawTemplateIds,
      },
    ]);

    await waitFor(() => {
      const rects = h.elements.filter((e) => e.type === "rectangle");
      expect(rects).toHaveLength(2);
      expect(rects[0].groupIds).toEqual(rects[1].groupIds);
      expect(rects[0].groupIds.length).toBeGreaterThan(0);
    });
  });

  it("inserts multi-element template via drag and drop", async () => {
    await API.drop([
      {
        kind: "string",
        value: JSON.stringify({ templateIds: ["mini-flowchart"] }),
        type: MIME_TYPES.excalidrawTemplateIds,
      },
    ]);

    await waitFor(() => {
      expect(h.elements.some((e) => e.type === "ellipse")).toBe(true);
      expect(h.elements.some((e) => e.type === "rectangle")).toBe(true);
      expect(h.elements.some((e) => e.type === "arrow")).toBe(true);
    });
  });

  it("adds selection to templates from the panel", async () => {
    const initialCount = getShapeTemplates().length;

    const rect1 = API.createElement({
      type: "rectangle",
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      groupIds: ["panel-group"],
    });
    const rect2 = API.createElement({
      type: "rectangle",
      x: 50,
      y: 0,
      width: 40,
      height: 40,
      groupIds: ["panel-group"],
    });

    API.setElements([rect1, rect2]);
    API.setAppState({
      selectedElementIds: { [rect1.id]: true, [rect2.id]: true },
      openSidebar: {
        name: DEFAULT_SIDEBAR.name,
        tab: SHAPE_TEMPLATES_SIDEBAR_TAB,
      },
    });

    const addButton = document.querySelector(
      '[data-testid="shape-templates-add-selection"]',
    ) as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    expect(addButton.disabled).toBe(false);

    fireEvent.click(addButton);

    await waitFor(() => {
      expect(getShapeTemplates().length).toBe(initialCount + 1);
    });
  });
});
