/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from "react";
import { Observable } from "rxjs";

export type ObservableStatus = "waiting" | "open" | "error" | "complete";

/** Subscribes to an observable and triggers a render when a new state is pushed */
export function useObservable<T>(observable: Observable<T> | undefined): [ObservableStatus, T?] {
  const [status, setStatus] = useState<ObservableStatus>("waiting");
  const [state, setState] = useState<T>();

  useEffect(() => {
    if (!observable) return;

    const subscription = observable.subscribe(
      (state) => {
        setState(state);
        if (status === "waiting") setStatus("open");
      },
      () => setStatus("error"),
      () => setStatus("complete")
    );
    return (): void => subscription.unsubscribe();
  }, [observable]);

  return [status, state];
}
