/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import figures, { bullet, main } from "figures";
import { Box, Text, useApp } from "ink";
import React, { useEffect } from "react";
import { State } from "../../lib/state";
import { TERMINAL_WIDTH } from "./constants";

const emojiSupport = bullet === main.bullet;

const Notice: React.FC = ({ children }) => (
  <Box marginTop={1}>
    <Box marginRight={1}>
      <Text color="whiteBright">{bullet}</Text>
    </Box>
    {children}
  </Box>
);

const CompletionSummary: React.FC<{ completed: number; failed: number }> = ({
  completed,
  failed,
}) => (
  <Box width={TERMINAL_WIDTH} justifyContent="center">
    <Box borderStyle="single" paddingX={2} flexDirection="column">
      <Box marginBottom={1} justifyContent="center">
        <Text bold>{emojiSupport && "🎉 "}All done!</Text>
      </Box>

      <Box>
        <Box>
          <Text>
            <Text color="green">{figures.tick}</Text> <Text bold>{completed}</Text> completed
          </Text>
        </Box>

        {!!failed && (
          <Box marginLeft={4}>
            <Text>
              <Text color="red" bold>
                {figures.cross}
              </Text>{" "}
              <Text bold>{failed}</Text> failed
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  </Box>
);

const Notices: React.FC<{ manifest: boolean; failed: boolean }> = ({ manifest, failed }) => (
  <Box paddingLeft={4} width={TERMINAL_WIDTH * 1.5} flexDirection="column">
    {manifest && (
      <Notice>
        <Text>
          A <Text color="whiteBright">manifest.json</Text> file has been generated.
        </Text>
      </Notice>
    )}

    {failed && (
      <Notice>
        <Text>
          Some images have failed, see <Text color="whiteBright">errors.json</Text> for more
          information.
        </Text>
      </Notice>
    )}
  </Box>
);

export const Summary: React.FC<{ state: State }> = ({ state }) => {
  const app = useApp();

  useEffect(() => {
    app.exit();
  }, []);

  return (
    <>
      <CompletionSummary completed={state.images.completed} failed={state.images.failed} />
      <Notices manifest={!!state.manifest} failed={!!state.images.failed} />
    </>
  );
};
