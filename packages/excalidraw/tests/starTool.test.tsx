import React from "react";

import { KEYS } from "@excalidraw/common";

import { Excalidraw } from "../index";

import { Keyboard } from "./helpers/ui";
import { render } from "./test-utils";

const { h } = window;

describe("star tool", () => {
  it("activates star tool via keyboard shortcut S", async () => {
    await render(<Excalidraw handleKeyboardGlobally />);

    expect(h.state.activeTool.type).toBe("selection");

    Keyboard.keyPress(KEYS.S);

    expect(h.state.activeTool.type).toBe("star");
  });
});
