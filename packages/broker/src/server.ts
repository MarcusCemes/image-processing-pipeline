import { Metadata, Pipeline } from "@rib/common";
import { ChildProcess, fork } from "child_process";
import { nanoid } from "nanoid";
import { cpus } from "os";
import { deserializeError } from "serialize-error";

import { BrokerException, ClientAction, ClientResponse } from "./common";

/** Compatible with Jest */
const CLIENT_SCRIPT = `${__dirname}/../dist/client`;

const DEFAULT_CONCURRENCY = cpus().length;
const START_TIMEOUT = 5000;
const KILL_TIMEOUT = 5000;

export interface Format {
  file: string;
  metadata: Metadata;
}

interface ServerJob {
  id: string;
  input: string;
  outDir: string;
  pipeline: Pipeline[];
  result: Promise<Format[]>;
  resolve: (value: Format[]) => void;
  reject: (err: any) => void;
}

interface BrokerOptions {
  concurrency?: number;
}

export interface Broker {
  execute: (input: string, output: string, pipeline: Pipeline[]) => Promise<Format[]>;
  stop: () => Promise<void>;
}

export async function createBroker(options: BrokerOptions = {}): Promise<Broker> {
  let active = true;
  let activeJobs = 0;
  const concurrency = options.concurrency || DEFAULT_CONCURRENCY;

  const brokerService = fork(CLIENT_SCRIPT, void 0, {
    env: { UV_THREADPOOL_SIZE: concurrency.toString(), NODE_OPTIONS: process.env.NODE_OPTIONS },
  });

  let globalQueue: ServerJob[] = [];
  const runningJobs = new Map<string, ServerJob>();

  const sendJobs = (): void => {
    if (!active) return;
    while (activeJobs < concurrency && globalQueue.length > 0) {
      const job = globalQueue.shift() as ServerJob;
      runningJobs.set(job.id, job);
      brokerService.send({ type: "JOB", ...job } as ClientAction);
      activeJobs++;
    }
  };

  const execute: Broker["execute"] = async (input, output, pipeline) => {
    const job = createJob(input, output, pipeline);
    globalQueue.push(job);

    sendJobs();

    const result = await job.result;

    runningJobs.delete(job.id);

    return result;
  };

  const handler = (message: ClientResponse): void => {
    if (!message || !message.type) return;
    switch (message.type) {
      case "DONE": {
        runningJobs.get(message.id)?.resolve(message.outputs);
        activeJobs--;
        sendJobs();
        break;
      }
      case "ERROR": {
        runningJobs.get(message.id)?.reject(deserializeError(message.err));
        activeJobs--;
        sendJobs();
        break;
      }
    }
  };

  const stop: Broker["stop"] = () => {
    runningJobs.forEach((job) => job.reject(new BrokerException("Broker stopped")));
    runningJobs.clear();
    globalQueue = [];

    active = false;
    brokerService.off("message", handler);
    return killProcess(brokerService, KILL_TIMEOUT);
  };

  brokerService.on("message", handler);

  await untilProcessStarted(brokerService, START_TIMEOUT);

  return {
    execute: execute,
    stop,
  };
}

function createJob(input: string, output: string, pipeline: Pipeline[]): ServerJob {
  const [result, resolve, reject] = createPromise<Format[]>();
  return {
    id: nanoid(),
    input,
    outDir: output,
    pipeline,
    result,
    resolve,
    reject,
  };
}

function untilProcessStarted(child: ChildProcess, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new BrokerException("The broker did not return the READY signal")), timeout);

    const handler = (message: ClientResponse): void => {
      if (typeof message === "object" && message !== null && message.type === "READY") {
        child.off("message", handler);
        resolve();
      }
    };
    child.on("message", handler);
  });
}

async function killProcess(process: ChildProcess, timeout: number): Promise<void> {
  process.kill("SIGTERM");
  const killTimeout = setTimeout(() => process.kill("SIGKILL"), timeout);
  await new Promise((res) => process.once("exit", res));
  clearTimeout(killTimeout);
}

function createPromise<T>(): [Promise<T>, (value: T) => void, (err: any) => void] {
  let resolve: (value: T) => void = () => {
    /* */
  };
  let reject: (err: any) => void = () => {
    /* */
  };
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return [promise, resolve, reject];
}
