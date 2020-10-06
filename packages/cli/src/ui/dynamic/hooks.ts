/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createContext, useContext } from "react";
import { EMPTY, Observable } from "rxjs";
import { useObservable } from "rxjs-hooks";
import { map } from "rxjs/operators";
import { State } from "../../lib/state";

export const appContext = createContext<Observable<State>>(EMPTY as Observable<State>);

export function useAppState<T>(map: (observable: Observable<State>) => Observable<T>): T | null {
  const observable = useContext(appContext);
  return useObservable(() => map(observable));
}

export function useAppStateValue<T>(mapper: (state: State) => T): T | null {
  return useAppState((obs) => obs.pipe(map(mapper)));
}
