import { State } from "@rib/core";
import { render } from "ink";
import React from "react";
import { Observable } from "rxjs";

import { Terminal } from "./Terminal";

export async function runTerminal(observable: Observable<State>) {
  await render(<Terminal observable={observable} />).waitUntilExit();
}
