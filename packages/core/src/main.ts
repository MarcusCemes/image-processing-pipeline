import { BehaviorSubject, Observable } from "rxjs";

import { Config, parseConfig } from "./config";
import { testPaths } from "./preparation";

import { produce } from "immer";

export interface Task {
  id: string;
  status: "waiting" | "pending" | "success" | "error" | "warning";
  text: string;
}

export interface State {
  status: "ready" | "running" | "finished" | "error";
  message: string;
  tasks: Task[];
  done: number;
  total: number;
}

export class ResponsiveImageBuilder {
  private config: Config;

  private state: State = {
    status: "ready",
    message: "Ready",
    tasks: [],
    done: 0,
    total: 0,
  };

  private statusSubject = new BehaviorSubject<State>(this.state);
  private statusObservable = this.statusSubject.asObservable();

  constructor(config: Partial<Config>) {
    this.config = parseConfig(config);
  }

  public getState() {
    return this.statusObservable;
  }

  public run(): Observable<State> {
    this.start()
      .then(() => this.statusSubject.complete())
      .catch((err) => this.statusSubject.error(err));
    return this.statusObservable;
  }

  /* == Methods == */

  private async start() {
    const tasks: Task[] = [];
    const taskConfigCheck: Task = { id: "CONFIG_CHECK", status: "pending", text: "Checking configuration" };
    tasks.push(taskConfigCheck);
    this.stateUpdate((state) => {
      state.status = "running";
      state.tasks = tasks;
    });

    // Check the configuration
    const pathError = await testPaths(this.config.options.input, this.config.options.output);
    this.stateUpdate((state) => {
      const task = state.tasks.find((task) => task.id === "CONFIG_CHECK");
      task!.status = pathError ? "error" : "success";
      task!.text = pathError ? "Configuration error" : "Configuration OK";
    });
    if (pathError) throw new Error(pathError);
  }

  private stateUpdate(cb: (state: State) => void): void {
    this.state = produce(this.state, cb);
    this.statusSubject.next(this.state);
  }
}

function updateTask(task: Task, status: Task["status"], text: Task["text"]): void {
  task.status = status;
  task.text = text;
}
