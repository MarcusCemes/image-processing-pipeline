/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Box, Newline, Static, Text } from "ink";
import React from "react";

const title = "Image Processing Pipeline";
const repo = "https://git.io/JJZdv";

const rawBanner = `._______________________
|   \\______   \\______   \\
|   ||     ___/|     ___/
|   ||    |    |    |
|___||____|    |____|`;

export const Banner: React.FC = () => (
  <Static items={[null]}>
    {() => (
      <Box key="banner" flexDirection="column" marginY={1} paddingLeft={8}>
        <Text>
          {rawBanner.split("\n").map((line, i) => (
            <React.Fragment key={i.toString()}>
              {line}
              <Newline />
            </React.Fragment>
          ))}
        </Text>

        <Box marginTop={1}>
          <Text>{title}</Text>
        </Box>

        <Box paddingLeft={2}>
          <Text color="grey">{repo}</Text>
        </Box>
      </Box>
    )}
  </Static>
);
