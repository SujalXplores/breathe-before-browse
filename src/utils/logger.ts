export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  readonly timestamp: number;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly source: 'background' | 'content' | 'popup';
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;

  private getSource(): 'background' | 'content' | 'popup' {
    if (typeof chrome !== 'undefined') {
      try {
        if (chrome.runtime?.getManifest?.()) {
          return 'background';
        }
      } catch {
      }

      if (typeof document !== 'undefined' && document?.body) {
        return 'content';
      }
    }
    return 'popup';
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const levelName = LogLevel[level];
    const source = this.getSource();
    const timestamp = new Date().toISOString();

    let formatted = `[${timestamp}] [${source.toUpperCase()}] [${levelName}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }

    return formatted;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      source: this.getSource()
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, logEntry);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, logEntry);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, logEntry);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, logEntry);
        break;
    }

    if (level >= LogLevel.ERROR && this.isDevelopment) {
      this.storeErrorLog(logEntry);
    }
  }

  private async storeErrorLog(logEntry: LogEntry): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['errorLogs']);
      const errorLogs = (result.errorLogs || []) as LogEntry[];

      errorLogs.push(logEntry);

      if (errorLogs.length > 50) {
        errorLogs.splice(0, errorLogs.length - 50);
      }

      await chrome.storage.local.set({ errorLogs });
    } catch (error) {
      console.error('Failed to store error log:', error);
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log general information
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };

    this.log(LogLevel.ERROR, message, errorContext);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Record<string, unknown>): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
      const mergedContext = { ...additionalContext, ...context };
      originalLog(level, message, mergedContext);
    };

    return childLogger;
  }

  /**
   * Get stored error logs for debugging
   */
  async getErrorLogs(): Promise<LogEntry[]> {
    try {
      const result = await chrome.storage.local.get(['errorLogs']);
      return result.errorLogs || [];
    } catch (error) {
      console.error('Failed to retrieve error logs:', error);
      return [];
    }
  }

  /**
   * Clear stored error logs
   */
  async clearErrorLogs(): Promise<void> {
    try {
      await chrome.storage.local.remove(['errorLogs']);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }
}

export const logger = new Logger();

export const createLogger = (context: Record<string, unknown>) => logger.child(context);
