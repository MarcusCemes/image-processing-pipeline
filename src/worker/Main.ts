// Responsive Image Builder - Worker/Main
// Entry-point to to the worker thread
import sharp from "sharp";

import { IConfig } from "../Config";
import { IFile } from "../Preparation";
import { ICommand, IWorkerResponse } from "./Interfaces";
import { ingest } from "./Process";
import { debug } from "./Utility";

let config: IConfig;
let currentJob: IFile = null;
const jobQueue: IFile[] = [];

let queueExit = false;

debug("Listening on IPC channel");
process.on("message", (message: ICommand) => {
  if (isCommand(message)) {
    switch (message.cmd) {
      case "INIT":
        debug("Received configuration", "IPC");
        config = message.config;
        break;

      case "FILE":
        debug("Received job", "IPC");
        jobQueue.push(message.file);
        if (message.accelerate) {
          sharp.concurrency(message.accelerate === true ? 0 : 1);
        }
        processQueue();
        break;

      case "KILL":
        debug("Received kill signal", "IPC");
        if (this.activeJobs > 0) {
          queueExit = true;
        } else {
          process.disconnect();
          process.exit();
        }
        break;
    }
  }
});

/** Starts processing the queue */
function processQueue() {
  if (currentJob) {
    return;
  }

  const job = jobQueue.shift();

  if (queueExit) {
    debug("Exiting...", "QUEUE");
    process.disconnect();
    process.exit();
  } else if (job) {
    debug("Starting new job", "QUEUE");
    currentJob = job;
    ingest(config, job).then(jobResult => {
      currentJob = null;
      const workerResponse: IWorkerResponse = {
        status: jobResult.success ? "COMPLETE" : "FAILED",
        data: jobResult.export
      };
      process.send(workerResponse);
      debug("Job complete", "QUEUE");
      processQueue();
    });
  }
}

function isCommand(obj: any): obj is ICommand {
  return typeof obj === "object" && typeof obj.cmd === "string";
}
