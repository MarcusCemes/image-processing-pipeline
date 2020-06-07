import { Exception, Pipeline, Metadata } from "@ipp/common";
import { ErrorObject } from "serialize-error";
export type ClientAction =
  | { id: string; type: "JOB"; input: string; pipeline: Pipeline[]; outDir: string }
  | { type: "KILL" };

export type ClientResponse =
  | { type: "READY" }
  | { id: string; type: "DONE"; outputs: Array<{ file: string; metadata: Metadata }> }
  | { id: string; type: "ERROR"; err: ErrorObject };

export class BrokerException extends Exception {
  name = "BrokerException";
  constructor(message?: string) {
    super(message);
  }
}
