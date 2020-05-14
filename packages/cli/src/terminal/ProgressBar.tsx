import { square } from "figures";
import { Box } from "ink";
import React from "react";

export const ProgressBar: React.FC<{ size?: number; progress?: number }> = ({ size = 10, progress = 0 }) => {
  const completion = Math.round(Math.max(1, Math.max(0, progress)) * size);
  const toGo = size - completion;

  return (
    <Box>
      {square.repeat(completion)}
      {".".repeat(toGo)}
    </Box>
  );
};
