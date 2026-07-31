export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface CapturedLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
}

export interface LoggerOptions {
  level?: LogLevel;
  silent?: boolean;
}

export class Logger {
  private level: LogLevel;
  private silent: boolean;
  private capturedLogs: CapturedLog[] | null = null;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.silent = options.silent ?? false;
  }

  static fromEnvironment(): Logger {
    const verbose = process.env.GRSPEC_VERBOSE === '1' || process.env.GRSPEC_VERBOSE === 'true';
    return new Logger({ level: verbose ? LogLevel.DEBUG : LogLevel.INFO });
  }

  setSilent(silent: boolean): void {
    this.silent = silent;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  capture(): CapturedLog[] {
    this.capturedLogs = [];
    return this.capturedLogs;
  }

  stopCapture(): void {
    this.capturedLogs = null;
  }

  clearCapture(): void {
    if (this.capturedLogs) {
      this.capturedLogs.length = 0;
    }
  }

  debug(message: string): void {
    this.log(LogLevel.DEBUG, 'debug', message);
  }

  info(message: string): void {
    this.log(LogLevel.INFO, 'info', message);
  }

  warn(message: string): void {
    this.log(LogLevel.WARN, 'warn', message);
  }

  error(message: string): void {
    this.log(LogLevel.ERROR, 'error', message);
  }

  private log(level: LogLevel, levelName: CapturedLog['level'], message: string): void {
    if (this.capturedLogs) {
      this.capturedLogs.push({ level: levelName, message });
    }

    if (this.silent || level < this.level) return;

    switch (levelName) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      default:
        console.log(message);
        break;
    }
  }
}

export const logger = Logger.fromEnvironment();
