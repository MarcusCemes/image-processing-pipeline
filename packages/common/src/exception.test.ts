import { Exception, PipeException, PipelineException } from "./exception";

it("exports an exception class", () => {
  const randomMessage = Math.random().toString();
  const exception = new Exception(randomMessage);

  expect(Exception).toBeDefined();
  expect(exception).toBeInstanceOf(Error);
  expect(exception.name).toBe(Exception.name);
  expect(exception.message).toBe(randomMessage);
});

it("exports a PipelineException class", () => {
  const randomMessage = Math.random().toString();
  const exception = new PipelineException(randomMessage);

  expect(PipelineException).toBeDefined();
  expect(exception).toBeInstanceOf(Error);
  expect(exception.name).toBe(PipelineException.name);
  expect(exception.message).toBe(randomMessage);
});

it("exports a PipeException class", () => {
  const randomMessage = Math.random().toString();
  const exception = new PipeException(randomMessage);

  expect(PipeException).toBeDefined();
  expect(exception).toBeInstanceOf(Error);
  expect(exception.name).toBe(PipeException.name);
  expect(exception.message).toBe(randomMessage);
});
