#!/usr/bin/env node
import PrettyError from "pretty-error";

import { startCLI } from "./cli";

(async (): Promise<void> => {
  try {
    await startCLI();
  } catch (err) {
    process.stdout.write("  The program encountered an error:\n\n");
    process.stdout.write(new PrettyError().setMaxItems(3).render(err));
    process.exitCode = 1;
  }
})();
