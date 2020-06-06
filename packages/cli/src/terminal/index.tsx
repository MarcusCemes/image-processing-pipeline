import { render } from "ink";
import React from "react";
import { Observable } from "rxjs";

import { UiState } from "./state";
import { Terminal } from "./Terminal";

interface UI {
  complete: () => Promise<void>;
  close: () => void;
}

export function runTerminal(version: string | null, observable: Observable<UiState>): UI {
  const ui = render(<Terminal version={version} observable={observable} />);

  return {
    complete: ui.waitUntilExit,
    close: ui.unmount,
  };
}
