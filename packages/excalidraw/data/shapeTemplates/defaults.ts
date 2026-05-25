import { randomId } from "@excalidraw/common";

import { newElement, newTextElement } from "@excalidraw/element";

import type { ShapeTemplate } from "./types";

const createProcessBoxTemplate = (): ShapeTemplate => {
  const text = newTextElement({
    x: 20,
    y: 20,
    width: 80,
    height: 25,
    text: "Process",
    fontSize: 20,
  });
  const rect = newElement({
    type: "rectangle",
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    backgroundColor: "#a5d8ff",
    strokeColor: "#1971c2",
    boundElements: [{ type: "text", id: text.id }],
  });
  const boundText = { ...text, containerId: rect.id };
  return {
    id: "builtin-process-box",
    name: "Process box",
    builtin: true,
    elements: [rect, boundText],
  };
};

const createGroupedCirclesTemplate = (): ShapeTemplate => {
  const groupId = randomId();
  const circle1 = newElement({
    type: "ellipse",
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    backgroundColor: "#ffc9c9",
    strokeColor: "#e03131",
    groupIds: [groupId],
  });
  const circle2 = newElement({
    type: "ellipse",
    x: 50,
    y: 30,
    width: 80,
    height: 80,
    backgroundColor: "#b2f2bb",
    strokeColor: "#2f9e44",
    groupIds: [groupId],
  });
  return {
    id: "builtin-grouped-circles",
    name: "Grouped circles",
    builtin: true,
    elements: [circle1, circle2],
  };
};

const createDecisionFlowTemplate = (): ShapeTemplate => {
  const diamond = newElement({
    type: "diamond",
    x: 40,
    y: 0,
    width: 100,
    height: 80,
    backgroundColor: "#ffec99",
    strokeColor: "#f08c00",
  });
  const yesBox = newElement({
    type: "rectangle",
    x: 0,
    y: 100,
    width: 80,
    height: 40,
    backgroundColor: "#d0ebff",
    strokeColor: "#1971c2",
  });
  const noBox = newElement({
    type: "rectangle",
    x: 120,
    y: 100,
    width: 80,
    height: 40,
    backgroundColor: "#ffe3e3",
    strokeColor: "#e03131",
  });
  return {
    id: "builtin-decision-flow",
    name: "Decision flow",
    builtin: true,
    elements: [diamond, yesBox, noBox],
  };
};

const createStickyClusterTemplate = (): ShapeTemplate => {
  const groupId = randomId();
  const sticky1 = newElement({
    type: "rectangle",
    x: 0,
    y: 0,
    width: 70,
    height: 70,
    backgroundColor: "#fff3bf",
    strokeColor: "#f59f00",
    roundness: { type: 3 },
    groupIds: [groupId],
  });
  const sticky2 = newElement({
    type: "rectangle",
    x: 40,
    y: 20,
    width: 70,
    height: 70,
    backgroundColor: "#d8f5a2",
    strokeColor: "#66a80f",
    roundness: { type: 3 },
    groupIds: [groupId],
  });
  const sticky3 = newElement({
    type: "rectangle",
    x: 20,
    y: 50,
    width: 70,
    height: 70,
    backgroundColor: "#a5d8ff",
    strokeColor: "#1971c2",
    roundness: { type: 3 },
    groupIds: [groupId],
  });
  return {
    id: "builtin-sticky-cluster",
    name: "Sticky cluster",
    builtin: true,
    elements: [sticky1, sticky2, sticky3],
  };
};

export const BUILTIN_SHAPE_TEMPLATES: readonly ShapeTemplate[] = [
  createProcessBoxTemplate(),
  createGroupedCirclesTemplate(),
  createDecisionFlowTemplate(),
  createStickyClusterTemplate(),
];
