/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cross, pointer, square, tick } from "figures";
import { Box, Static, Text } from "ink";
import Spinner from "ink-spinner";
import React, { ReactNode } from "react";
import { Stage, State, Status, Task } from "../../model/state";
import { UiContext } from "../ui";
import { ObservableStatus, useObservable } from "./useObservable";

const WIDTH = 40;

const Layout: React.FC = ({ children }) => (
  <Box width={WIDTH} flexDirection="column" alignItems="center">
    <Box flexDirection="column" minWidth={0.4 * WIDTH}>
      {children}
    </Box>
  </Box>
);

const rawBanner = `._______________________
|   \\______   \\______   \\
|   ||     ___/|     ___/
|   ||    |    |    |
|___||____|    |____|`;

const Banner: React.FC = () => (
  <Static items={[null]}>
    {() => (
      <Box key="banner" flexDirection="column" marginY={1} paddingLeft={8}>
        {rawBanner.split("\n").map((x, i) => (
          <Box key={i.toString()}>
            <Text>{x}</Text>
          </Box>
        ))}

        <Box marginTop={1}>
          <Text>Image Processing Pipeline</Text>
        </Box>

        <Box paddingLeft={2}>
          <Text color="grey">https://git.io/JJZdv</Text>
        </Box>
      </Box>
    )}
  </Static>
);

const Tasks: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
  <>
    {tasks.map((t) => {
      const [colour, icon]: [string | undefined, ReactNode] =
        t.status === Status.PENDING
          ? ["cyan", <Spinner key="spinner" />]
          : t.status === Status.ERROR
          ? ["red", cross]
          : t.status === Status.COMPLETE
          ? ["green", tick]
          : [void 0, " "];

      return (
        <Box key={t.id}>
          <Text color={colour}>{icon}</Text>
          <Box marginLeft={1}>
            <Text color={t.status === Status.WAITING ? "grey" : void 0}>{t.text}</Text>
          </Box>
        </Box>
      );
    })}
  </>
);

const StageIndicator: React.FC<{
  stage: Stage;
  completed: boolean;
  message: string | undefined;
}> = ({ stage, completed, message }) => {
  switch (stage) {
    case Stage.DONE:
      return (
        <Text bold color="greenBright">
          {pointer} Complete
        </Text>
      );

    case Stage.ERROR:
      return (
        <Box flexDirection="column">
          <Box>
            <Text bold color="red">
              {pointer} Error
            </Text>
          </Box>
          {message && (
            <Box marginTop={1} width={80}>
              <Text color="red">{message}</Text>
            </Box>
          )}
        </Box>
      );

    case Stage.INTERRUPT:
      return (
        <Box flexDirection="column">
          <Text bold color="#FF851B">
            {pointer} Interrupt
          </Text>
          {!completed && (
            <Text color="#cc6a16">
              Press{" "}
              <Text bold color="#FF851B">
                Ctrl-C
              </Text>{" "}
              to force exit
            </Text>
          )}
        </Box>
      );

    default:
      return null;
  }
};

const ProgressBar: React.FC<{ width: number; progress: number }> = ({ width, progress }) => {
  const parsedProgress = isNaN(progress) ? 0 : progress;
  const clampedProgress = Math.max(0, Math.min(1, parsedProgress));

  const textWidth = 5;
  const progressText = `${Math.round(clampedProgress * 100)}%`.padStart(textWidth);

  const internalWidth = width - textWidth;
  const dots = Math.max(0, Math.min(internalWidth, Math.round(clampedProgress * internalWidth)));
  const space = internalWidth - dots;

  return (
    <Box>
      <Text backgroundColor="white">{square.repeat(dots)}</Text>
      <Text backgroundColor="#333">{" ".repeat(space)}</Text>
      <Text>{progressText}</Text>
    </Box>
  );
};

const Exceptions: React.FC<{ count: number }> = ({ count }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Box>
      <Text bold color="red">
        {count} images failed to process
      </Text>
    </Box>
    <Box>
      <Text color="red">
        More information can be found in the generated <Text bold>errors.json</Text>
      </Text>
    </Box>
  </Box>
);

const StateView: React.FC<{ state?: State }> = ({ state }) => {
  if (!state) return null;

  return (
    <>
      {state && state.stage !== Stage.ERROR && (
        <Layout>
          <Tasks tasks={state.tasks} />
        </Layout>
      )}
      {state && state.stage === Stage.PROCESSING && (
        <>
          <Box marginTop={1} width={WIDTH} justifyContent="center">
            <Box flexBasis={4} flexShrink={1}></Box>
            {/* <ProgressBar
              width={24}
              progress={
                (state.stats.images.completed + state.stats.images.failed) /
                state.stats.images.total
              }
            /> */}
          </Box>
        </>
      )}
    </>
  );
};

const Completion: React.FC<{ state?: State; status: ObservableStatus }> = ({ state, status }) => {
  if (!state || (status !== "complete" && ![Stage.INTERRUPT, Stage.ERROR].includes(state.stage)))
    return null;

  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1} paddingLeft={8}>
      {state && (
        <>
          {state.stats.images.failed > 0 && <Exceptions count={state.stats.images.failed} />}
          <StageIndicator
            stage={state.stage}
            completed={status === Status.COMPLETE}
            message={state.message}
          />
        </>
      )}
    </Box>
  );
};

export const Terminal: React.FC<{ ctx: UiContext }> = ({ ctx }) => {
  const [status, state] = useObservable(ctx.state);

  return (
    <>
      <Banner />
      <StateView state={state} />
      <Completion state={state} status={status} />
    </>
  );
};
