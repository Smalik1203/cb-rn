// src/lib/logger.ts
// Centralized logging utility with configurable levels

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;
  private showTimestamps: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
    this.showTimestamps = false; // Disable timestamps for cleaner output
    // In development, show only errors and warnings. In production, only errors
    this.level = this.isDevelopment ? LogLevel.WARN : LogLevel.ERROR;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    if (this.showTimestamps) {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] ${level}: ${message}`;
    }
    return `${level}: ${message}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  // Special method for auth-related logs (only in development)
  auth(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🔐 ${message}`, ...args);
    }
  }

  // Special method for API-related logs (only in development)
  api(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🌐 ${message}`, ...args);
    }
  }

  // Special method for storage-related logs (only in development)
  storage(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`💾 ${message}`, ...args);
    }
  }

  // Method to set log level dynamically
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // Method to enable/disable development mode logging
  setDevelopmentMode(enabled: boolean): void {
    this.isDevelopment = enabled;
    if (!enabled) {
      this.level = LogLevel.ERROR;
    }
  }

  // Method to enable/disable timestamps
  setTimestamps(enabled: boolean): void {
    this.showTimestamps = enabled;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  auth: logger.auth.bind(logger),
  api: logger.api.bind(logger),
  storage: logger.storage.bind(logger),
};
