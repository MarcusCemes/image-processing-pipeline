/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type Operator<I, O> = RawOperator<I, ObjectStream<O>>;
export type RawOperator<I, O> = (source: AsyncIterable<I>) => O;

export interface ObjectStream<T> extends AsyncIterable<T> {
  pipe: <O>(operator: RawOperator<T, O>) => O;
}

export function createObjectStream<T>(source: AsyncIterable<T>): ObjectStream<T> {
  return {
    [Symbol.asyncIterator]: () => source[Symbol.asyncIterator](),
    pipe: <O>(operator: RawOperator<T, O>) => operator(source),
  };
}
