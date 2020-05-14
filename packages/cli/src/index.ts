#!/usr/bin/env node
import PrettyError from "pretty-error";

import { startCLI } from "./cli";

//! DEVELOPMENT ONLY
setTimeout(() => process.exit(0), 5000).unref();

(async () => {
  try {
    await startCLI();
  } catch (err) {
    process.stdout.write("  The program encountered an error:\n\n");
    process.stdout.write(new PrettyError().render(err));
    process.exit(1);
  }
})();
