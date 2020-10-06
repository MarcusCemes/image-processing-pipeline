/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import figures from "figures";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import React, { ReactNode } from "react";
import { Status as StateStatus } from "../../lib/state";
import { ORANGE } from "./constants";
import { useAppStateValue } from "./hooks";

const statusMap: Record<StateStatus, [string, string, ReactNode?]> = {
  [StateStatus.READY]: ["green", "Ready"],
  [StateStatus.PROCESSING]: ["cyan", "Processing", <Spinner key="spin" />],
  [StateStatus.COMPLETE]: ["green", "Complete"],
  [StateStatus.ERROR]: ["red", "Error"],
  [StateStatus.INTERRUPT]: [ORANGE, "Interrupted"],
};

export const Status: React.FC = () => {
  const status = useAppStateValue((state) => state.status);
  if (status === null) return null;

  const currentStatus = statusMap[status];
  const symbol = currentStatus[2] || figures.pointer;

  return (
    <Box marginTop={1}>
      <Text color={currentStatus[0]}>
        {symbol} {currentStatus[1]}
      </Text>
    </Box>
  );
};
