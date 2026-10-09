type LogLevel = "info" | "error";

function write(level: LogLevel, message: string, extra?: Record<string, unknown>) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...extra,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.info(line);
}

export const logger = {
  info(message: string, extra?: Record<string, unknown>) {
    write("info", message, extra);
  },
  error(message: string, extra?: Record<string, unknown>) {
    write("error", message, extra);
  },
};
