import { Pipe } from "@rib/common";

import { ConvertPipe } from "./convert";
import { PassthroughPipe } from "./passthrough";
import { ResizePipe } from "./resize";

export const PIPES: { [index: string]: Pipe<any> } = {
  convert: ConvertPipe,
  passthrough: PassthroughPipe,
  resize: ResizePipe,
} as const;
