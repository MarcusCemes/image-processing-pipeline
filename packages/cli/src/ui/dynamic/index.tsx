/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { render, RenderOptions } from "ink";
import React from "react";
import { UI } from "../ui";
import { Summary } from "./Summary";
import { View } from "./View";

// const enterAltScreenBuffer = "\x1b[?1049h";
// const exitAltScreenBuffer = "\x1b[?1049l";

export const DynamicUI: UI = (ctx) => {
  const ui = render(<View observable={ctx.state} />, { exitOnCtrlC: true } as RenderOptions);

  return {
    stop: async (state) => {
      ui.rerender(<Summary state={state} />);
      await ui.waitUntilExit();
    },
  };
};
