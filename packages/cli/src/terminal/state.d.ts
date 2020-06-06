import { ColorProps } from "ink";

export interface Task {
  status: "waiting" | "pending" | "success" | "error" | "warning";
  text: string;
  colour?: ColorProps;
}

export interface UiState {
  concurrency?: number;
  tasks: {
    preparation: Task;
    search: Task;
    process: Task;
  };
  images?: number;
  progress?: number;
}
