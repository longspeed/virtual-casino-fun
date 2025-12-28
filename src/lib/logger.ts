/**
 * Logger utility for development and production
 * Only logs errors in development mode to avoid exposing sensitive information in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, errors could be sent to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
};

