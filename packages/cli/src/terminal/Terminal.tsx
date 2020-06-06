import { Box, Color, Static, Text } from "ink";
import React from "react";
import { Observable } from "rxjs";

import { Indicator } from "./Indicator";
import { ProgressBar } from "./ProgressBar";
import { UiState } from "./state";
import { SystemLoad } from "./SystemLoad";
import { useObservable } from "./useObservable";

const PRINT_WIDTH = 36;

const Banner: React.FC = () => (
  <Box marginTop={2} marginBottom={1} flexDirection="column" alignItems="center">
    <Text>
      {`   ______   _____ _______
  (, /   ) (, /  (, /    )
    /__ /    /     /---(
 ) /   \\____/__ ) / ____)
(_/    (__ /   (_/ (
`}
    </Text>
    <Text>A modern image pipeline</Text>
    <Text>
      <Color grey>https://git.io/fjvL7</Color>
    </Text>
  </Box>
);

const Tasks: React.FC<{ tasks?: UiState["tasks"] }> = ({ tasks }) => {
  if (!tasks) return null;
  return (
    <Box paddingBottom={1} flexDirection="column">
      {Object.entries([tasks.preparation, tasks.search, tasks.process]).map(([id, task]) =>
        task.status !== "waiting" ? (
          <Box key={id}>
            <Indicator state={task.status} colour={task.colour} /> {task.text}
          </Box>
        ) : (
          <Box key={id} paddingLeft={2}>
            <Color grey>{task.text}</Color>
          </Box>
        )
      )}
    </Box>
  );
};

const Progress: React.FC<{ progress?: number }> = ({ progress }) => {
  if (typeof progress !== "number") return null;

  return (
    <Box justifyContent="center">
      <Box>
        <ProgressBar size={20} progress={progress} /> {Math.round(100 * progress || 0)}%
      </Box>
    </Box>
  );
};

export const Terminal: React.FC<{ version: string | null; observable: Observable<UiState> }> = ({ observable }) => {
  const [status, state] = useObservable(observable);

  return (
    <>
      <Static>
        {[
          <Box key="static" paddingLeft={4} width={PRINT_WIDTH} flexDirection="column" alignItems="center">
            <Banner />
          </Box>,
        ]}
      </Static>
      <Box paddingLeft={4} width={PRINT_WIDTH} flexDirection="column" alignItems="center">
        <Tasks tasks={state?.tasks} />
        {status === "open" && typeof state?.progress === "number" && (
          <>
            <Color cyanBright>
              <Progress progress={state.progress} />
            </Color>

            <Box>
              <Color cyanBright>
                Concurrency: {state.concurrency} | Load: <SystemLoad />
              </Color>
            </Box>
          </>
        )}
      </Box>
    </>
  );
};
