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
