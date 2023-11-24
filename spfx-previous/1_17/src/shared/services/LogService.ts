import Application from 'shared/constants/Application';

/* export interface ILogService {
  verbose(callingFunction: string, ...args: any[]): void;
  info(callingFunction: string, ...args: any[]): void;
  warn(callingFunction: string, ...args: any[]): void;
  error(callingFunction: string, ...args: any[]): void;
} */

export default class LogService {
  private static instance: LogService = null;
  private static prefix: string;

  private constructor(prefix: string) {
    LogService.prefix = `[${prefix}]`;
  }

  public static debug(callingFunction: string, ...args: any[]): void {
    if (/debug=((true)|(1))/i.test(window.location.search)) this.info(callingFunction, args);
  }

  public static init(prefix: string): void {
    if (LogService.instance === null) {
      LogService.instance = new LogService(prefix);
    }
  }

  public static verbose(callingFunction: string, ...args: any[]): void {
    try {
      // eslint-disable-next-line no-console
      const logFunction = !!console && typeof console.debug === 'function' ? console.debug : null;
      this.logToConsole(callingFunction, logFunction, ...args);
    } catch (ex) {}
  }

  public static info(callingFunction: string, ...args: any[]): void {
    try {
      // eslint-disable-next-line no-console
      const logFunction = !!console && typeof console.info === 'function' ? console.info : null;
      this.logToConsole(callingFunction, logFunction, ...args);
    } catch (ex) {}
  }

  public static warn(callingFunction: string, ...args: any[]): void {
    try {
      // eslint-disable-next-line no-console
      const logFunction = !!console && typeof console.warn === 'function' ? console.warn : null;
      this.logToConsole(callingFunction, logFunction, ...args);
    } catch (ex) {}
  }

  public static error(callingFunction: string, ...args: any[]): void {
    try {
      // eslint-disable-next-line no-console
      const logFunction = !!console && typeof console.error === 'function' ? console.error : null;
      this.logToConsole(callingFunction, logFunction, ...args);
    } catch (ex) {}
  }

  private static logToConsole(
    callingFunction: string,
    logFunction: (message?: any, ...optionalParams: any[]) => void,
    ...args: any[]
  ): void {
    if (typeof logFunction === 'function') {
      const logTime: string = new Date().toLocaleTimeString('en-GB');
      logFunction(`[${logTime}]${LogService.prefix}${callingFunction ? `[${callingFunction}]` : ''}`, ...args);
    }
  }
}
