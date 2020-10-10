/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Box, Text } from "ink";
import React from "react";
import { VERSION } from "../../constants";
import { useAppStateValue } from "./hooks";

const Config: React.FC = () => {
  const concurrency = useAppStateValue((state) => state.concurrency);
  const manifest = useAppStateValue((state) => !!state.manifest);
  const clean = useAppStateValue((state) => !!state.clean);
  if (concurrency === null) return null;

  return (
    <Box marginBottom={1} flexDirection="column">
      <Text>
        Version: <Text bold>{VERSION.toString()}</Text>
      </Text>
      <Text>
        Concurrency: <Text bold>{concurrency}</Text>
      </Text>
      <Text color={manifest ? void 0 : "grey"}>
        Manifest: <Text bold>{manifest ? "enabled" : "disabled"}</Text>
      </Text>
      <Text color={clean ? void 0 : "grey"}>
        Clean: <Text bold>{clean ? "enabled" : "disabled"}</Text>
      </Text>
    </Box>
  );
};

const Found: React.FC = () => {
  const found = useAppStateValue((state) => state.images.found);
  if (found === null) return null;

  return <Text>Total: {found}</Text>;
};

const Completed: React.FC = () => {
  const completed = useAppStateValue((state) => state.images.completed);
  if (completed === null || completed === 0) return null;

  return <Text color="green">Completed: {completed}</Text>;
};

const Failed: React.FC = () => {
  const failed = useAppStateValue((state) => state.images.failed);
  if (failed === null || failed === 0) return null;

  return (
    <>
      <Text color="red">Failed: {failed}</Text>
    </>
  );
};

export const Stats: React.FC = () => (
  <>
    <Config />
    <Box flexDirection="column">
      <Found />
      <Completed />
      <Failed />
    </Box>
  </>
);
