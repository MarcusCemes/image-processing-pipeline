import { useEffect, useState } from "react";
import { Observable } from "rxjs";

type ObservableStatus = "closed" | "open" | "error" | "complete";
type ObservableState<T> = [ObservableStatus, T?];

export function useObservable<T>(observable: Observable<T> | undefined): ObservableState<T> {
  const [status, setStatus] = useState<ObservableStatus>("closed");
  const [state, setState] = useState<T>();

  useEffect(() => {
    if (!observable) return;

    setStatus("open");
    const subscription = observable.subscribe(
      setState,
      () => setStatus("error"),
      () => setStatus("complete")
    );
    return (): void => subscription.unsubscribe();
  }, [observable]);

  return [status, state];
}
