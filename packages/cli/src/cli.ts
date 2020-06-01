import { createBroker } from "@rib/broker";
import chalk from "chalk";
import { produce } from "immer";
import { resolve } from "path";
import { BehaviorSubject } from "rxjs";
import { options } from "yargs";

import { JobResult } from "./common";
import { ConfigException, ConfigLoadException, loadConfig } from "./config";
import { findImages } from "./findImages";
import { createInterrupt, InterruptException } from "./interrupt";
import { saveManifest } from "./manifest";
import { runPreparation } from "./preparation";
import { runTerminal } from "./terminal";
import { Task, UiState } from "./terminal/state";
import { formatError, getVersion, printPadded } from "./utils";

/** Used to update the UI state using the *ìmmer* library */
type UiStateUpdater = (state: UiState) => void;

/** A cleanup function */
type Cleanup = () => void | Promise<void>;

/** The main entry, parses terminal flags and launches the application */
export async function startCLI(): Promise<void> {
  const version = await getVersion();

  const { argv } = options({
    input: { type: "string", alias: "i", description: "The folder containing source images" },
    output: { type: "string", alias: "o", description: "The folder to output images to" },
    config: { type: "string", alias: "c", description: "The path to the RIB config file" },
    silent: { type: "boolean", alias: "s", description: "Suppress program output" },
  }).version(version || "[Unknown version]");

  const configPath = argv.config ? resolve(argv.config) : void 0;

  try {
    await run(version, configPath, argv.input, argv.output, argv.silent);
  } catch (err) {
    if (err instanceof ConfigLoadException) {
      return printConfigLoadException(err);
    } else if (err instanceof ConfigException) {
      return printConfigException(err);
    } else if (err instanceof InterruptException) {
      return printInterrupted();
    }
    throw err;
  }
}

/** Loads configuration and runs the CLI application */
async function run(
  version: string | null,
  path?: string,
  input?: string,
  output?: string,
  silent?: boolean
): Promise<void> {
  // Cleanup functions to execute in case of error or completion
  const cleanup: Cleanup[] = [];

  try {
    // Create UI-data structures and helper functions
    const { uiSubject, updateState, updateTask, taskWrapper } = createUi();
    cleanup.push(uiSubject.complete);

    // Handle process interruptions
    const interrupt = createInterrupt();
    cleanup.push(() => interrupt.destroy());

    // Start the terminal UI
    const terminal = !silent ? runTerminal(version, uiSubject.asObservable()) : null;
    if (terminal) cleanup.push(terminal.close);

    const config = await taskWrapper(
      "preparation",
      "Checking configuration...",
      "Configuration OK",
      "Configuration error",
      async () => {
        // Load config from path or well-known location
        const loadedConfig = await loadConfig(path);

        if (input) loadedConfig.input = input;
        if (output) loadedConfig.output = output;

        // Run path checks, returns a validated config
        return runPreparation(loadedConfig);
      }
    );
    updateState((state) => {
      // Set the concurrency in the UI
      state.concurrency = config.options.concurrency;
    });

    // Search for images and warm up the broker
    const [jobs, broker] = await Promise.race([
      interrupt.promise,

      Promise.all([
        taskWrapper("search", "Searching for images", "Searching for images", "Failed to search for images", () =>
          findImages(config.input, config.output, config.options.flat)
        ).then((r) => {
          updateTask("search", "success", `Found ${r.length} image${r.length === 1 ? "" : "s"}`);
          return r;
        }),

        Promise.resolve()
          .then(() => {
            updateState((state) => {
              state.tasks.process.colour = { yellow: true };
            });
          })
          .then(() =>
            taskWrapper("process", "Warming up...", "Waiting for images", "Broker error", () =>
              createBroker({ concurrency: config.options?.concurrency })
            ).then((r) => {
              updateTask("process", "waiting", "Waiting for images");
              updateState((state) => {
                state.tasks.process.colour = void 0;
              });

              cleanup.push(r.stop);
              return r;
            })
          ),
      ]),
    ]);
    updateTask("process", "pending", "Processing images");
    updateState((state) => {
      state.progress = 0;
    });

    // Start image processing
    try {
      let processed = 0;
      let total = 0;

      const jobResults = jobs.map(async (job) => {
        total++;
        const formats = await broker.execute(job.i, job.o, config.pipeline);
        updateState((state) => {
          state.progress = ++processed / total;
        });
        return { source: job.i, formats } as JobResult;
      });

      const completedJobs: JobResult[] = await Promise.race([interrupt.promise, Promise.all(jobResults)]);

      updateState((state) => {
        state.progress = void 0;
        state.tasks.process.status = "pending";
        state.tasks.process.text = "Saving manifest";
      });

      // Save the manifest and finish
      if (config.options.manifest === true) await saveManifest(config, completedJobs);
    } catch (err) {
      updateState((state) => {
        state.progress = void 0;
        state.tasks.process.status = "error";
        state.tasks.process.text = "Processing error";
      });
      throw err;
    }

    updateTask("process", "success", "Processing complete");
  } finally {
    // Run all cleanup functions
    await Promise.all(
      cleanup.map(async (f) => {
        try {
          await f();
        } catch {
          /* */
        }
      })
    );
  }
}

/** Creates the UI state data structure and helper functions */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createUi() {
  const uiSubject = new BehaviorSubject<UiState>({
    tasks: {
      preparation: {
        status: "waiting",
        text: "Check configuration",
      },
      search: {
        status: "waiting",
        text: "Search for images",
      },
      process: {
        status: "waiting",
        text: "Process images",
      },
    },
  });

  const updateState = (cb: UiStateUpdater): void => {
    uiSubject.next(
      produce(uiSubject.getValue(), (state) => {
        cb(state);
      })
    );
  };

  const updateTask = (name: keyof UiState["tasks"], status: Task["status"], text: string): void => {
    updateState((state) => {
      state.tasks[name].status = status;
      state.tasks[name].text = text;
    });
  };

  const taskWrapper = async <R>(
    name: keyof UiState["tasks"],
    pending: string,
    success: string,
    error: string,
    cb: () => Promise<R>
  ): Promise<R> => {
    try {
      updateTask(name, "pending", pending);
      const result = await cb();
      updateTask(name, "success", success);
      return result;
    } catch (err) {
      updateTask(name, "error", error);
      throw err;
    }
  };

  return {
    uiSubject,
    updateState,
    updateTask,
    taskWrapper,
  };
}

function printConfigLoadException(error: any): void {
  process.stdout.write("\n");
  printPadded(
    chalk.bold.red("Configuration Load Error"),
    "Unable to open/read/parse the configuration file.",
    "The following error may help you:\n"
  );
  process.stdout.write(formatError(error) + "\n");
}

function printConfigException(error: any): void {
  printPadded(
    chalk.bold.red("Configuration Error"),
    "The configuration is not valid.",
    "For help, visit the project's documentation on valid configuration.",
    "The following error may help you:\n"
  );
  process.stdout.write(formatError(error) + "\n");
}

function printInterrupted(): void {
  printPadded(chalk.bold.red("Interrupted"), "The program received an interrupt signal\n");
}