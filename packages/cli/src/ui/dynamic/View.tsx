/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Box } from "ink";
import React from "react";
import { StateObservable } from "../../lib/state";
import { Banner } from "./Banner";
import { TERMINAL_WIDTH } from "./constants";
import { appContext } from "./hooks";
import { Stats } from "./Stats";
import { Status } from "./Status";

const Providers: React.FC<{ observable: StateObservable }> = ({ children, observable: state }) => (
  <appContext.Provider value={state}>{children}</appContext.Provider>
);

const App: React.FC = () => (
  <Box width={TERMINAL_WIDTH} flexDirection="column" alignItems="center">
    <Stats />
    <Status />
  </Box>
);

export const View: React.FC<{ observable: StateObservable }> = ({ observable: state }) => {
  return (
    <>
      <Providers observable={state}>
        <Banner />
        <App />
      </Providers>
    </>
  );
};
