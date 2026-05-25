import { useCallback, useMemo } from "react";

import { MIME_TYPES } from "@excalidraw/common";

import { duplicateElements } from "@excalidraw/element";

import {
  getShapeTemplates,
  instantiateShapeTemplate,
} from "../data/shapeTemplates/shapeTemplates";
import { useLibraryCache } from "../hooks/useLibraryItemSvg";
import { t } from "../i18n";

import { useApp } from "./App";
import {
  LibraryMenuSection,
  LibraryMenuSectionGrid,
} from "./LibraryMenuSection";
import "./ShapeTemplatesMenu.scss";

import type { ExcalidrawTemplateIds } from "../data/shapeTemplates/types";
import type { LibraryItem } from "../types";

const ITEMS_RENDERED_PER_BATCH = 17;

export const ShapeTemplatesMenu = () => {
  const app = useApp();
  const { svgCache } = useLibraryCache();

  const templateItems = useMemo((): LibraryItem[] => {
    return getShapeTemplates().map((template) => ({
      id: template.id,
      status: "published" as const,
      created: 0,
      name: template.name,
      elements: instantiateShapeTemplate(template),
    }));
  }, []);

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

  return (
    <div className="layer-ui__shape-templates shape-templates-menu">
      <div className="shape-templates-menu__header">
        <p className="shape-templates-menu__hint">{t("shapeTemplates.hint")}</p>
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
