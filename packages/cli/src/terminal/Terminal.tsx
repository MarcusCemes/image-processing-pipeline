import { State, Task } from "@rib/core";
import { Box, Color, Text } from "ink";
import React, { useEffect, useState } from "react";
import { Observable } from "rxjs";

import { Indicator } from "./Indicator";
import { ProgressBar } from "./ProgressBar";

type ObservableStatus = "closed" | "open" | "error" | "complete";
type ObservableState<T> = [ObservableStatus, T?];
function useObservable<T>(observable: Observable<T> | undefined): ObservableState<T> {
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
    return () => {
      subscription.unsubscribe();
    };
  }, [observable]);

  return [status, state];
}

const Tasks: React.FC<{ tasks?: Task[] }> = ({ tasks }) => {
  if (!tasks) return null;
  return (
    <Box paddingBottom={1}>
      {tasks.map((task) =>
        task.status === "waiting" ? (
          <Box key={task.id}>
            <Color grey> {task.status}</Color>
          </Box>
        ) : (
          <Box key={task.id}>
            <Indicator state={task.status} /> {task.text}
          </Box>
        )
      )}
    </Box>
  );
};

const StatusLine: React.FC<{ state?: State }> = ({ state }) => {
  if (!state) return null;

  const props = !state
    ? { yellow: true }
    : state.status === "error"
    ? { red: true }
    : state.status === "running"
    ? { cyan: true }
    : { green: true };

  return (
    <Box>
      <Text bold>
        Status: <Color {...props}>{state ? state.status : "Connecting..."}</Color>
        {"  "}
        {state?.status === "running" && (
          <Box>
            <ProgressBar size={20} progress={state.done / state.total || 0} />{" "}
            {Math.round((100 * state.done) / state.total || 0)}%
          </Box>
        )}
      </Text>
    </Box>
  );
};

export const Terminal: React.FC<{ observable: Observable<State> }> = ({ observable }) => {
  const [status, state] = useObservable(observable);

  return (
    <Box paddingLeft={4} flexDirection="column">
      <Tasks tasks={state?.tasks} />
      {status === "open" && <StatusLine state={state} />}
    </Box>
  );
};
