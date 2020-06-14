export interface Metadata {
  format: string;
  width: number;
  height: number;
  channels: number;
  [index: string]: any;
}

export interface PipeResult {
  output: Buffer;
  metadata: Metadata;
}

export type Pipe<O extends Record<string, any> = Record<string, any>> = (
  input: Buffer,
  metadata: Metadata,
  options?: O
) => Promise<PipeResult> | Promise<PipeResult[]>;

export interface Pipeline<O extends Record<string, any> = Record<string, any>> {
  pipe: Pipe | string | { resolve: string; module?: string };
  options?: O;
  save?: string;
  then?: Pipeline[];
}
