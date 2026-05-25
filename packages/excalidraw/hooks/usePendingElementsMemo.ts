import { useEffect, useRef, useState } from "react";

import { isShallowEqual } from "@excalidraw/common";

import type {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

import { getSelectedElements } from "../scene";

import { useExcalidrawElements } from "../components/App";

import type { AppClassProperties, UIAppState } from "../types";

const getPendingElements = (
  elements: readonly NonDeletedExcalidrawElement[],
  selectedElementIds: UIAppState["selectedElementIds"],
) => ({
  elements,
  pending: getSelectedElements(
    elements,
    { selectedElementIds },
    {
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    },
  ),
  selectedElementIds,
});

export const usePendingElementsMemo = (
  appState: UIAppState,
  app: AppClassProperties,
) => {
  const elements = useExcalidrawElements();
  const [state, setState] = useState(() =>
    getPendingElements(elements, appState.selectedElementIds),
  );

  const selectedElementVersions = useRef(
    new Map<ExcalidrawElement["id"], ExcalidrawElement["version"]>(),
  );

  useEffect(() => {
    for (const element of state.pending) {
      selectedElementVersions.current.set(element.id, element.version);
    }
  }, [state.pending]);

  useEffect(() => {
    if (
      app.state.cursorButton === "up" &&
      app.state.activeTool.type === "selection"
    ) {
      setState((prev) => {
        if (
          !isShallowEqual(prev.selectedElementIds, appState.selectedElementIds)
        ) {
          selectedElementVersions.current.clear();
          return getPendingElements(elements, appState.selectedElementIds);
        }
        const elementsMap = app.scene.getNonDeletedElementsMap();
        for (const id of Object.keys(appState.selectedElementIds)) {
          const currVersion = elementsMap.get(id)?.version;
          if (
            currVersion &&
            currVersion !== selectedElementVersions.current.get(id)
          ) {
            return getPendingElements(elements, appState.selectedElementIds);
          }
        }
        return prev;
      });
    }
  }, [
    app,
    app.state.cursorButton,
    app.state.activeTool.type,
    appState.selectedElementIds,
    elements,
  ]);

  return state.pending;
};
