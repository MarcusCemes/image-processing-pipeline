import { Exception } from "./exception";

it("exports Exception class", () => {
  expect(Exception).toBeDefined();
});

it("extends Exception and Error", () => {
  const exception = new Exception();
  expect(exception).toBeInstanceOf(Error);
});

it("has a name", () => {
  const exception = new Exception();
  expect(exception.name === "Exception");
});

it("provides a message", () => {
  const message = "This is a message";
  const exception = new Exception(message);
  expect(exception.message === message);
});
