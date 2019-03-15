import chalk from "chalk";
import figures from "figures";
import indent from "indent-string";

export class Logger {
  public static SILENT = 0;
  public static ERRORS = 0;
  public static VERBOSE = 2;

  public static SUCCESS = chalk.green(figures.tick);
  public static FAIL = chalk.red(figures.cross);
  public verbosity: number = Logger.VERBOSE;

  constructor(verbosity: string = "verbose") {
    if (verbosity === "silent") {
      this.verbosity = Logger.SILENT;
    }
    if (verbosity === "errors") {
      this.verbosity = Logger.ERRORS;
    }
  }

  /** Log arbitrary text at a certain log level */
  public log(text: string, ind: number = 6, logLevel = Logger.VERBOSE) {
    if (this.verbosity < logLevel) {
      return this;
    }
    process.stdout.write(indent(text + "\n", ind));
    return this;
  }

  /** Shows a standard success message */
  public success(text: string, ind: number = 6, showIcon: boolean = true) {
    if (this.verbosity < Logger.VERBOSE) {
      return this;
    }
    let icon = "";
    if (showIcon) {
      icon = chalk.green(figures.tick);
    } else {
      text = chalk.green(text);
    }
    process.stdout.write(indent(`${icon} ${text}\n`, ind));
    return this;
  }

  /** Prints a standard error message */
  public error(text: string, ind: number = 6, showIcon: boolean = true) {
    if (this.verbosity < Logger.ERRORS) {
      return this;
    }
    let icon = "";
    if (showIcon) {
      icon = chalk.red(figures.cross);
    } else {
      text = chalk.red(text);
    }
    process.stdout.write(indent(`${icon} ${text}\n`, ind));
    return this;
  }

  /** Prints a standard warning message */
  public warning(text: string, ind: number = 6, showIcon: boolean = true) {
    if (this.verbosity < Logger.VERBOSE) {
      return this;
    }
    let icon = "";
    if (showIcon) {
      icon = chalk.keyword("orange")(figures.warning);
    } else {
      text = chalk.keyword("orange")(text);
    }
    process.stdout.write(indent(`${icon} ${text}\n`, ind));
    return this;
  }

  /** Prints a standard info message */
  public info(text: string, ind: number = 6, showIcon: boolean = true) {
    if (this.verbosity < Logger.VERBOSE) {
      return this;
    }
    let icon = "";
    if (showIcon) {
      icon = chalk.blue(figures.info);
    } else {
      text = chalk.blue(text);
    }
    process.stdout.write(indent(`${icon} ${text}\n`, ind));
    return this;
  }
}
