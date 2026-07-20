type LogPayload = Record<string, any>;

export class Logger {
  /** Log informational message with structured payload */
  static info(message: string, payload?: LogPayload) {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        ...payload,
      })
    );
  }

  /** Log warnings with structured payload */
  static warn(message: string, payload?: LogPayload) {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message,
        ...payload,
      })
    );
  }

  /** Log errors with details and stack traces */
  static error(message: string, error?: Error, payload?: LogPayload) {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        ...payload,
      })
    );
  }

  /** Measure execution duration of an asynchronous block of code */
  static async measure<T>(
    name: string,
    fn: () => Promise<T>,
    payload?: LogPayload
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = parseFloat((performance.now() - start).toFixed(2));
      Logger.info(`Performance: ${name}`, {
        durationMs: duration,
        status: "success",
        ...payload,
      });
      return result;
    } catch (err) {
      const duration = parseFloat((performance.now() - start).toFixed(2));
      Logger.error(`Performance Failed: ${name}`, err instanceof Error ? err : new Error(String(err)), {
        durationMs: duration,
        status: "error",
        ...payload,
      });
      throw err;
    }
  }
}
