import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from "react";

import {
  LIBRARY_DISABLED_TYPES,
  randomId,
  KEYS,
  isWritableElement,
  addEventListener,
  EVENT,
  CLASSES,
} from "@excalidraw/common";

import { trackEvent } from "../analytics";
import { useUIAppState } from "../context/ui-appState";
import {
  distributeLibraryItemsOnSquareGrid,
  libraryItemsAtom,
} from "../data/library";
import { atom, useAtom } from "../editor-jotai";
import { t } from "../i18n";

import { usePendingElementsMemo } from "../hooks/usePendingElementsMemo";

import {
  useApp,
  useAppProps,
  useExcalidrawSetAppState,
} from "./App";
import { LibraryMenuControlButtons } from "./LibraryMenuControlButtons";
import LibraryMenuItems from "./LibraryMenuItems";
import Spinner from "./Spinner";

import "./LibraryMenu.scss";

import type {
  LibraryItems,
  LibraryItem,
  ExcalidrawProps,
  UIAppState,
} from "../types";
import type Library from "../data/library";

export const isLibraryMenuOpenAtom = atom(false);

const LibraryMenuWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="layer-ui__library">{children}</div>;
};

const LibraryMenuContent = memo(
  ({
    onInsertLibraryItems,
    pendingElements,
    onAddToLibrary,
    setAppState,
    libraryReturnUrl,
    library,
    id,
    theme,
    selectedItems,
    onSelectItems,
  }: {
    pendingElements: LibraryItem["elements"];
    onInsertLibraryItems: (libraryItems: LibraryItems) => void;
    onAddToLibrary: () => void;
    setAppState: React.Component<any, UIAppState>["setState"];
    libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
    library: Library;
    id: string;
    theme: UIAppState["theme"];
    selectedItems: LibraryItem["id"][];
    onSelectItems: (id: LibraryItem["id"][]) => void;
  }) => {
    const [libraryItemsData] = useAtom(libraryItemsAtom);

    const _onAddToLibrary = useCallback(
      (elements: LibraryItem["elements"]) => {
        const addToLibrary = async (
          processedElements: LibraryItem["elements"],
          libraryItems: LibraryItems,
        ) => {
          trackEvent("element", "addToLibrary", "ui");
          for (const type of LIBRARY_DISABLED_TYPES) {
            if (processedElements.some((element) => element.type === type)) {
              return setAppState({
                errorMessage: t(`errors.libraryElementTypeError.${type}`),
              });
            }
          }
          const nextItems: LibraryItems = [
            {
              status: "unpublished",
              elements: processedElements,
              id: randomId(),
              created: Date.now(),
            },
            ...libraryItems,
          ];
          onAddToLibrary();
          library.setLibrary(nextItems).catch(() => {
            setAppState({ errorMessage: t("alerts.errorAddingToLibrary") });
          });
        };
        addToLibrary(elements, libraryItemsData.libraryItems);
      },
      [onAddToLibrary, library, setAppState, libraryItemsData.libraryItems],
    );

    const libraryItems = useMemo(
      () => libraryItemsData.libraryItems,
      [libraryItemsData],
    );

    if (
      libraryItemsData.status === "loading" &&
      !libraryItemsData.isInitialized
    ) {
      return (
        <LibraryMenuWrapper>
          <div className="layer-ui__library-message">
            <div>
              <Spinner size="2em" />
              <span>{t("labels.libraryLoadingMessage")}</span>
            </div>
          </div>
        </LibraryMenuWrapper>
      );
    }

    const showBtn =
      libraryItemsData.libraryItems.length > 0 || pendingElements.length > 0;

    return (
      <LibraryMenuWrapper>
        <LibraryMenuItems
          isLoading={libraryItemsData.status === "loading"}
          libraryItems={libraryItems}
          onAddToLibrary={_onAddToLibrary}
          onInsertLibraryItems={onInsertLibraryItems}
          pendingElements={pendingElements}
          id={id}
          libraryReturnUrl={libraryReturnUrl}
          theme={theme}
          onSelectItems={onSelectItems}
          selectedItems={selectedItems}
        />
        {showBtn && (
          <LibraryMenuControlButtons
            className="library-menu-control-buttons--at-bottom"
            style={{ padding: "16px 12px 0 12px" }}
            id={id}
            libraryReturnUrl={libraryReturnUrl}
            theme={theme}
          />
        )}
      </LibraryMenuWrapper>
    );
  },
);

/**
 * This component is meant to be rendered inside <Sidebar.Tab/> inside our
 * <DefaultSidebar/> or host apps Sidebar components.
 */
export const LibraryMenu = memo(() => {
  const app = useApp();
  const { onInsertElements } = app;
  const appProps = useAppProps();
  const appState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();
  const [selectedItems, setSelectedItems] = useState<LibraryItem["id"][]>([]);
  const memoizedLibrary = useMemo(() => app.library, [app.library]);
  const pendingElements = usePendingElementsMemo(appState, app);

  useEffect(() => {
    return addEventListener(
      document,
      EVENT.KEYDOWN,
      (event) => {
        if (event.key === KEYS.ESCAPE && event.target instanceof HTMLElement) {
          const target = event.target;
          if (target.closest(`.${CLASSES.SIDEBAR}`)) {
            // stop propagation so that we don't prevent it downstream
            // (default browser behavior is to clear search input on ESC)
            if (selectedItems.length > 0) {
              event.stopPropagation();
              setSelectedItems([]);
            } else if (
              isWritableElement(target) &&
              target instanceof HTMLInputElement &&
              !target.value
            ) {
              event.stopPropagation();
              // if search input empty -> close library
              // (maybe not a good idea?)
              setAppState({ openSidebar: null });
              app.focusContainer();
            }
          } else if (selectedItems.length > 0) {
            const { x, y } = app.lastViewportPosition;
            const elementUnderCursor = document.elementFromPoint(x, y);
            // also deselect elements if sidebar doesn't have focus but the
            // cursor is over it
            if (elementUnderCursor?.closest(`.${CLASSES.SIDEBAR}`)) {
              event.stopPropagation();
              setSelectedItems([]);
            }
          }
        }
      },
      { capture: true },
    );
  }, [selectedItems, setAppState, app]);

  const onInsertLibraryItems = useCallback(
    (libraryItems: LibraryItems) => {
      onInsertElements(distributeLibraryItemsOnSquareGrid(libraryItems));
      app.focusContainer();
    },
    [onInsertElements, app],
  );

  const deselectItems = useCallback(() => {
    setAppState({
      selectedElementIds: {},
      selectedGroupIds: {},
      activeEmbeddable: null,
    });
  }, [setAppState]);

  return (
    <LibraryMenuContent
      pendingElements={pendingElements}
      onInsertLibraryItems={onInsertLibraryItems}
      onAddToLibrary={deselectItems}
      setAppState={setAppState}
      libraryReturnUrl={appProps.libraryReturnUrl}
      library={memoizedLibrary}
      id={app.id}
      theme={appState.theme}
      selectedItems={selectedItems}
      onSelectItems={setSelectedItems}
    />
  );
});
