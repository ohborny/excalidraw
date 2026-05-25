import { LIBRARY_DISABLED_TYPES } from "@excalidraw/common";

import { CaptureUpdateAction } from "@excalidraw/element";

import {
  createShapeTemplateFromElements,
  loadCustomShapeTemplates,
  saveCustomShapeTemplates,
  shapeTemplatesAtom,
} from "../data/shapeTemplates";
import { editorJotaiStore } from "../editor-jotai";
import { t } from "../i18n";

import { register } from "./register";

export const actionAddToShapeTemplates = register({
  name: "addToShapeTemplates",
  trackEvent: { category: "element" },
  perform: (elements, appState, _, app) => {
    const selectedElements = app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    });

    if (!selectedElements.length) {
      return false;
    }

    for (const type of LIBRARY_DISABLED_TYPES) {
      if (selectedElements.some((element) => element.type === type)) {
        return {
          captureUpdate: CaptureUpdateAction.EVENTUALLY,
          appState: {
            ...appState,
            errorMessage: t(`errors.libraryElementTypeError.${type}`),
          },
        };
      }
    }

    const customTemplates = loadCustomShapeTemplates();
    const newTemplate = createShapeTemplateFromElements(
      selectedElements,
      t("shapeTemplates.untitled"),
    );
    const nextTemplates = [newTemplate, ...customTemplates];
    saveCustomShapeTemplates(nextTemplates);
    editorJotaiStore.set(shapeTemplatesAtom, {
      customTemplates: nextTemplates,
    });

    return {
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
      appState: {
        ...appState,
        toast: { message: t("shapeTemplates.added") },
      },
    };
  },
  label: "labels.addToShapeTemplates",
});
