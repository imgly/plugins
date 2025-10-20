/* eslint-disable no-console */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

export class Logger {
  private static globalLogLevel: LogLevel = 'info';

  private static logs: LogEntry[] = [];

  private static maxLogs = 1000;

  constructor(private component: string) {}

  static setLogLevel(level: LogLevel): void {
    Logger.globalLogLevel = level;
  }

  static getLogs(): LogEntry[] {
    return [...Logger.logs];
  }

  static clearLogs(): void {
    Logger.logs = [];
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const levelOrder: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (levelOrder[level] < levelOrder[Logger.globalLogLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      component: this.component,
      message,
      data,
    };

    Logger.logs.push(entry);

    // Keep logs under the limit
    if (Logger.logs.length > Logger.maxLogs) {
      Logger.logs = Logger.logs.slice(-Logger.maxLogs);
    }

    // Console output
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${
      this.component
    }]`;
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;

    switch (level) {
      case 'debug':
        console.debug(prefix, logMessage);
        break;
      case 'info':
        console.info(prefix, logMessage);
        break;
      case 'warn':
        console.warn(prefix, logMessage);
        break;
      case 'error':
        console.error(prefix, logMessage);
        break;
      default:
        // All log levels handled above
        break;
    }
  }
}
