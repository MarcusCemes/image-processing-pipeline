import { chainMock } from "./mocks";

describe("function chainMock()", () => {
  test("returns a similar object", () => {
    const obj = chainMock({ data: 42 });

    expect(obj).toHaveProperty("data", 42);
  });

  test("handles recursive calls", () => {
    const obj = chainMock({ data: 42 });

    expect(obj).toHaveProperty("data", 42);
    expect(obj.someFn()).toHaveProperty("data", 42);
    expect(obj.someFn().anyOtherFn()).toHaveProperty("data", 42);
  });
});
