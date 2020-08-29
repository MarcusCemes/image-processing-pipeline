/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import produce from "immer";
import { BehaviorSubject, Observable } from "rxjs";

export enum Stage {
  INIT = "init",
  PROCESSING = "processing",
  DONE = "done",
  ERROR = "error",
  INTERRUPT = "interrupt",
}

export enum Status {
  COMPLETE = "complete",
  ERROR = "error",
  PENDING = "pending",
  WAITING = "waiting",
}

export interface Task {
  id: string;
  status: Status;
  text: string;
}

export interface Statistics {
  concurrency: number;

  images: {
    active: number;
    total: number;
    completed: number;
    failed: number;
  };
}

export interface State {
  stage: Stage;
  message?: string;

  tasks: Task[];
  stats: Statistics;
}

export interface StateContext {
  complete: () => void;
  observable: Observable<State>;
  update: (cb: (state: State) => void) => void;

  tasks: {
    add: (id: string, status: Status, text: string) => TaskContext;
    update: (id: string, status?: Status, text?: string) => void;
    remove: (id: string) => void;
  };
}

export interface TaskContext {
  update: (status?: Status, text?: string) => void;
  remove: () => void;
}

export function createState(concurrency: number): StateContext {
  let state: State = {
    stage: Stage.INIT,
    tasks: [],
    stats: {
      concurrency,
      images: {
        active: 0,
        completed: 0,
        failed: 0,
        total: 0,
      },
    },
  };

  const subject = new BehaviorSubject(state);

  const observable = subject.asObservable();

  const update = (cb: (state: State) => void) => {
    const newState = produce(state, (state) => {
      cb(state);
    });

    if (newState !== state) {
      state = newState;
      subject.next(state);
    }
  };

  const complete = () => subject.complete();

  const tasks: StateContext["tasks"] = {
    add: (id: string, status: Status, text: string) => {
      update((state) => {
        if (state.tasks.find((t) => t.id === id)) {
          throw new Error("Task already exists");
        }

        state.tasks.push({ id, status, text });
      });

      return {
        update: (status?: Status, text?: string) => tasks.update(id, status, text),
        remove: () => tasks.remove(id),
      };
    },

    update: (id: string, status?: Status, text?: string) => {
      update((state) => {
        const existingTask = state.tasks.find((t) => t.id === id);

        if (!existingTask) {
          throw new Error("Task does is not registered");
        }

        if (status) existingTask.status = status;
        if (text) existingTask.text = text;
      });
    },

    remove: (id: string) => {
      update((state) => {
        const index = state.tasks.findIndex((v) => v.id === id);
        if (index !== -1) {
          state.tasks.splice(index, 1);
        }
      });
    },
  };

  return { complete, observable, tasks, update };
}
