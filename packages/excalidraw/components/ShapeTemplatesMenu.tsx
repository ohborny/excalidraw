import React, { useCallback, useEffect, useMemo, useState } from "react";

import { LIBRARY_DISABLED_TYPES, isShallowEqual } from "@excalidraw/common";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

import { useUIAppState } from "../context/ui-appState";
import {
  BUILTIN_SHAPE_TEMPLATES,
  createShapeTemplateFromElements,
  getShapeTemplatesForInstantiation,
  loadCustomShapeTemplates,
  saveCustomShapeTemplates,
  shapeTemplatesAtom,
} from "../data/shapeTemplates";
import { atom, useAtom } from "../editor-jotai";
import { t } from "../i18n";
import { getSelectedElements } from "../scene";

import { useApp, useExcalidrawElements, useExcalidrawSetAppState } from "./App";
import { Button } from "./Button";
import ShapeTemplatesMenuItems from "./ShapeTemplatesMenuItems";

import "./ShapeTemplatesMenu.scss";

import type { ShapeTemplates } from "../data/shapeTemplates/types";
import type { UIAppState } from "../types";

export const isShapeTemplatesMenuOpenAtom = atom(false);

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

export const ShapeTemplatesMenu = () => {
  const app = useApp();
  const appState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();
  const elements = useExcalidrawElements();
  const [shapeTemplatesData, setShapeTemplatesData] =
    useAtom(shapeTemplatesAtom);

  const [pendingState, setPendingState] = useState(() =>
    getPendingElements(elements, appState.selectedElementIds),
  );

  useEffect(() => {
    setShapeTemplatesData({ customTemplates: loadCustomShapeTemplates() });
  }, [setShapeTemplatesData]);

  useEffect(() => {
    if (
      app.state.cursorButton === "up" &&
      app.state.activeTool.type === "selection"
    ) {
      setPendingState((prev) => {
        if (
          !isShallowEqual(prev.selectedElementIds, app.state.selectedElementIds)
        ) {
          return getPendingElements(elements, app.state.selectedElementIds);
        }
        return prev;
      });
    }
  }, [
    elements,
    app.state.cursorButton,
    app.state.activeTool.type,
    app.state.selectedElementIds,
  ]);

  const pendingElements = useMemo(() => {
    if (!pendingState.pending.length) {
      return [];
    }
    return createShapeTemplateFromElements(pendingState.pending).elements;
  }, [pendingState.pending]);

  const customTemplates = shapeTemplatesData.customTemplates;

  const onInsertTemplates = useCallback(
    (templates: ShapeTemplates) => {
      const elementsToInsert = getShapeTemplatesForInstantiation(templates);
      app.addElementsFromPasteOrLibrary({
        elements: elementsToInsert,
        position: "center",
        files: null,
        preserveFrameChildrenOrder: true,
      });
    },
    [app],
  );

  const onSavePending = useCallback(() => {
    const selectedElements = pendingState.pending;
    if (!selectedElements.length) {
      return;
    }

    for (const type of LIBRARY_DISABLED_TYPES) {
      if (selectedElements.some((element) => element.type === type)) {
        setAppState({
          errorMessage: t(`errors.libraryElementTypeError.${type}`),
        });
        return;
      }
    }

    const newTemplate = createShapeTemplateFromElements(
      selectedElements,
      t("shapeTemplates.untitled"),
    );
    const nextTemplates = [newTemplate, ...customTemplates];
    saveCustomShapeTemplates(nextTemplates);
    setShapeTemplatesData({ customTemplates: nextTemplates });
    setPendingState((prev) => ({ ...prev, pending: [] }));
    setAppState({
      toast: { message: t("shapeTemplates.added") },
    });
  }, [
    pendingState.pending,
    customTemplates,
    setAppState,
    setShapeTemplatesData,
  ]);

  const onDeleteCustom = useCallback(() => {
    saveCustomShapeTemplates([]);
    setShapeTemplatesData({ customTemplates: [] });
  }, [setShapeTemplatesData]);

  return (
    <div className="shape-templates-menu layer-ui__shape-templates">
      <ShapeTemplatesMenuItems
        builtinTemplates={BUILTIN_SHAPE_TEMPLATES}
        customTemplates={customTemplates}
        pendingElements={pendingElements}
        onInsertTemplates={onInsertTemplates}
        onSavePending={onSavePending}
      />
      {customTemplates.length > 0 && (
        <div className="shape-templates-menu-control-buttons">
          <Button
            onSelect={onDeleteCustom}
            style={{ width: "100%" }}
            type="button"
          >
            {t("shapeTemplates.clearCustom")}
          </Button>
        </div>
      )}
    </div>
  );
};
