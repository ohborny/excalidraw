import { useCallback, useMemo } from "react";

import { LIBRARY_DISABLED_TYPES, MIME_TYPES } from "@excalidraw/common";

import { duplicateElements } from "@excalidraw/element";

import { useUIAppState } from "../context/ui-appState";
import {
  exportSelectionAsShapeTemplate,
  getShapeTemplates,
  getUserShapeTemplates,
  instantiateShapeTemplate,
  registerShapeTemplates,
  shapeTemplatesVersionAtom,
  ShapeTemplateExportError,
} from "../data/shapeTemplates/shapeTemplates";
import { useAtom } from "../editor-jotai";
import { usePendingElementsMemo } from "../hooks/usePendingElementsMemo";
import { useLibraryCache } from "../hooks/useLibraryItemSvg";
import { t } from "../i18n";

import { useApp, useExcalidrawSetAppState } from "./App";
import {
  LibraryMenuSection,
  LibraryMenuSectionGrid,
} from "./LibraryMenuSection";
import { ToolButton } from "./ToolButton";
import "./ShapeTemplatesMenu.scss";

import type { ExcalidrawTemplateIds } from "../data/shapeTemplates/types";
import type { LibraryItem } from "../types";

const ITEMS_RENDERED_PER_BATCH = 17;

export const ShapeTemplatesMenu = () => {
  const app = useApp();
  const appState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();
  const { svgCache } = useLibraryCache();
  const pendingElements = usePendingElementsMemo(appState, app);
  const [templatesVersion] = useAtom(shapeTemplatesVersionAtom);

  const templateItems = useMemo((): LibraryItem[] => {
    return getShapeTemplates().map((template) => ({
      id: template.id,
      status: "published" as const,
      created: 0,
      name: template.name,
      elements: instantiateShapeTemplate(template),
    }));
  }, [templatesVersion]);

  const onAddSelectionToTemplates = useCallback(() => {
    if (!pendingElements.length) {
      setAppState({ errorMessage: t("shapeTemplates.noSelection") });
      return;
    }

    try {
      const template = exportSelectionAsShapeTemplate(pendingElements, {
        name: t("shapeTemplates.unnamed", {
          n: String(getUserShapeTemplates().length + 1),
        }),
      });
      registerShapeTemplates([template]);
      setAppState({
        toast: { message: t("shapeTemplates.added") },
        selectedElementIds: {},
        selectedGroupIds: {},
        activeEmbeddable: null,
      });
    } catch (error) {
      if (error instanceof ShapeTemplateExportError) {
        const message = error.message.startsWith("errors.")
          ? t(error.message as any)
          : error.message;
        setAppState({ errorMessage: message });
        return;
      }
      throw error;
    }
  }, [pendingElements, setAppState]);

  const onInsertTemplate = useCallback(
    (id: LibraryItem["id"] | null) => {
      if (!id) {
        return;
      }
      const template = getShapeTemplates().find((item) => item.id === id);
      if (!template) {
        return;
      }
      const elements = instantiateShapeTemplate(template);
      const { duplicatedElements } = duplicateElements({
        type: "everything",
        elements,
        randomizeSeed: true,
        preserveFrameChildrenOrder: true,
      });
      app.onInsertElements(duplicatedElements);
    },
    [app],
  );

  const onItemDrag = useCallback((id: string, event: React.DragEvent) => {
    const data: ExcalidrawTemplateIds = { templateIds: [id] };
    event.dataTransfer.setData(
      MIME_TYPES.excalidrawTemplateIds,
      JSON.stringify(data),
    );
  }, []);

  const hasDisabledType = pendingElements.some((element) =>
    LIBRARY_DISABLED_TYPES.has(element.type as any),
  );

  return (
    <div className="layer-ui__shape-templates shape-templates-menu">
      <div className="shape-templates-menu__header">
        <p className="shape-templates-menu__hint">{t("shapeTemplates.hint")}</p>
        <ToolButton
          type="button"
          title={t("shapeTemplates.addSelection")}
          aria-label={t("shapeTemplates.addSelection")}
          label={t("shapeTemplates.addSelection")}
          onClick={onAddSelectionToTemplates}
          disabled={!pendingElements.length || hasDisabledType}
          data-testid="shape-templates-add-selection"
          className="shape-templates-menu__add-btn"
        />
      </div>
      <div className="shape-templates-menu__grid">
        <LibraryMenuSectionGrid>
          <LibraryMenuSection
            items={templateItems}
            onClick={onInsertTemplate}
            onItemSelectToggle={() => {}}
            onItemDrag={onItemDrag}
            isItemSelected={() => false}
            svgCache={svgCache}
            itemsRenderedPerBatch={ITEMS_RENDERED_PER_BATCH}
          />
        </LibraryMenuSectionGrid>
      </div>
    </div>
  );
};
