/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
type MockedChain<T extends Record<string, unknown>> = T & { [index: string]: () => MockedChain<T> };

/**
 * Creates a proxy around an object that will redirect calls to an unknown to a
 * function that returns the object. Useful for mocking modules that allow for
 * function chaining.
 *
 * @example
 * const proxy = chainMock({ data: 42 });
 * proxy.someFn().otherFn().data
 * // 42
 */
export function chainMock<T extends Record<string, unknown>>(obj: T): MockedChain<T> {
  const proxy = new Proxy(obj, {
    get: (target: Record<string, unknown>, prop: string) =>
      typeof target[prop] !== "undefined" ? target[prop] : () => proxy,
  });
  return proxy as MockedChain<T>;
}

/**
 * Returns the first parameter T, but correctly typed to represent a generic Jest mock of
 * a function of type T
 */
export function getMock<T extends () => any>(fn: T): jest.Mock<ReturnType<T>, Parameters<T>> {
  return fn as unknown as jest.Mock<ReturnType<T>, Parameters<T>>;
}
