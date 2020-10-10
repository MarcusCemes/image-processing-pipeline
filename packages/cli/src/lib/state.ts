/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import produce from "immer";
import { BehaviorSubject, Observable } from "rxjs";

export enum Status {
  READY,
  PROCESSING,
  COMPLETE,
  ERROR,
  INTERRUPT,
}

export interface State {
  status: Status;

  concurrency: number;
  clean: boolean;
  manifest: boolean;

  images: {
    found: number;
    completed: number;
    failed: number;
  };
}

export type StateObservable = Observable<State>;

export interface StateContext {
  observable: StateObservable;
  getValue: () => State;
  update: (fn: (state: State) => void) => void;
  complete: () => State;
}

export function createStateContext(
  concurrency: number,
  manifest: boolean,
  clean: boolean
): StateContext {
  const subject = new BehaviorSubject<State>({
    status: Status.READY,
    concurrency,
    clean,
    manifest,
    images: {
      found: 0,
      completed: 0,
      failed: 0,
    },
  });

  return {
    observable: subject.asObservable(),
    getValue: () => subject.getValue(),

    update: (fn: (state: State) => void) =>
      subject.next(
        produce(subject.getValue(), (state) => {
          fn(state);
        })
      ),

    complete: () => {
      const lastValue = subject.getValue();
      subject.complete();
      return lastValue;
    },
  };
}
