import React, { useCallback, useRef, useState } from "react";

import { MIME_TYPES } from "@excalidraw/common";

import { duplicateElements } from "@excalidraw/element";

import { t } from "../i18n";
import { useLibraryCache } from "../hooks/useLibraryItemSvg";

import {
  LibraryMenuSection,
  LibraryMenuSectionGrid,
} from "./LibraryMenuSection";

import "./ShapeTemplatesMenu.scss";

import type { ExcalidrawShapeTemplateIds } from "../data/shapeTemplates/types";
import type {
  ShapeTemplate,
  ShapeTemplates,
} from "../data/shapeTemplates/types";
import type { LibraryItem } from "../types";

const ITEMS_RENDERED_PER_BATCH = 17;

export default function ShapeTemplatesMenuItems({
  builtinTemplates,
  customTemplates,
  pendingElements,
  onInsertTemplates,
  onSavePending,
}: {
  builtinTemplates: ShapeTemplates;
  customTemplates: ShapeTemplates;
  pendingElements: ShapeTemplate["elements"];
  onInsertTemplates: (templates: ShapeTemplates) => void;
  onSavePending: () => void;
}) {
  const libraryContainerRef = useRef<HTMLDivElement>(null);
  const { svgCache } = useLibraryCache();
  const [selectedItems, setSelectedItems] = useState<ShapeTemplate["id"][]>([]);

  const toLibraryShape = (
    templates: ShapeTemplates,
  ): (LibraryItem | { id: null; elements: ShapeTemplate["elements"] })[] =>
    templates.map((template) => ({
      id: template.id,
      status: "unpublished" as const,
      elements: template.elements,
      created: template.created ?? 0,
      name: template.name,
    }));

  const getInsertedTemplates = useCallback(
    (id: string) => {
      const allTemplates = [...builtinTemplates, ...customTemplates];
      const targetTemplates = selectedItems.includes(id)
        ? allTemplates.filter((item) => selectedItems.includes(item.id))
        : allTemplates.filter((item) => item.id === id);

      return targetTemplates.map((template) => ({
        ...template,
        elements: duplicateElements({
          type: "everything",
          elements: template.elements,
          randomizeSeed: true,
          preserveFrameChildrenOrder: true,
        }).duplicatedElements,
      }));
    },
    [builtinTemplates, customTemplates, selectedItems],
  );

  const onItemDrag = useCallback(
    (id: ShapeTemplate["id"], event: React.DragEvent) => {
      const data: ExcalidrawShapeTemplateIds = {
        templateIds: selectedItems.includes(id) ? selectedItems : [id],
      };
      event.dataTransfer.setData(
        MIME_TYPES.excalidrawShapeTemplateIds,
        JSON.stringify(data),
      );
    },
    [selectedItems],
  );

  const onItemSelectToggle = useCallback(
    (id: ShapeTemplate["id"], event: React.MouseEvent) => {
      setSelectedItems((prev) => {
        if (event.shiftKey) {
          return prev.includes(id)
            ? prev.filter((itemId) => itemId !== id)
            : [...prev, id];
        }
        return prev.includes(id) && prev.length === 1 ? [] : [id];
      });
    },
    [],
  );

  const isItemSelected = useCallback(
    (id: ShapeTemplate["id"] | null) => {
      if (!id) {
        return false;
      }
      return selectedItems.includes(id);
    },
    [selectedItems],
  );

  const onItemClick = useCallback(
    (id: ShapeTemplate["id"] | null) => {
      if (id) {
        onInsertTemplates(getInsertedTemplates(id));
      }
    },
    [getInsertedTemplates, onInsertTemplates],
  );

  const hasCustom = customTemplates.length > 0 || pendingElements.length > 0;

  return (
    <div
      className="shape-templates-menu-items-container"
      ref={libraryContainerRef}
    >
      <div className="shape-templates-menu-items-container__header">
        {t("shapeTemplates.builtin")}
      </div>
      <LibraryMenuSectionGrid>
        <LibraryMenuSection
          items={toLibraryShape(builtinTemplates)}
          onItemSelectToggle={onItemSelectToggle}
          onItemDrag={onItemDrag}
          onClick={onItemClick}
          isItemSelected={isItemSelected}
          svgCache={svgCache}
          itemsRenderedPerBatch={ITEMS_RENDERED_PER_BATCH}
        />
      </LibraryMenuSectionGrid>

      {hasCustom && (
        <>
          <div className="shape-templates-menu-items-container__header">
            {t("shapeTemplates.custom")}
          </div>
          <LibraryMenuSectionGrid>
            {pendingElements.length > 0 && (
              <LibraryMenuSection
                items={[{ id: null, elements: pendingElements }]}
                onItemSelectToggle={onItemSelectToggle}
                onItemDrag={onItemDrag}
                onClick={onSavePending}
                isItemSelected={isItemSelected}
                svgCache={svgCache}
                itemsRenderedPerBatch={ITEMS_RENDERED_PER_BATCH}
              />
            )}
            <LibraryMenuSection
              items={toLibraryShape(customTemplates)}
              onItemSelectToggle={onItemSelectToggle}
              onItemDrag={onItemDrag}
              onClick={onItemClick}
              isItemSelected={isItemSelected}
              svgCache={svgCache}
              itemsRenderedPerBatch={ITEMS_RENDERED_PER_BATCH}
            />
          </LibraryMenuSectionGrid>
        </>
      )}

      {!hasCustom && (
        <div className="shape-templates-menu-items__hint">
          {t("shapeTemplates.hint_emptyCustom")}
        </div>
      )}
    </div>
  );
}
