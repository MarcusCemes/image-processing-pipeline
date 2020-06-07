import { Pipe } from "@ipp/common";

/** A pipe that does nothing to the image. Used for testing */
export const PassthroughPipe: Pipe = async (input, metadata) => {
  return {
    output: input,
    metadata,
  };
};
