# Logging Strategy

## Frontend Logging

```typescript
// libs/core/utils/src/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = import.meta.env.DEV ? 'debug' : 'warn';

export const logger = {
  debug: (msg: string, data?: object) => log('debug', msg, data),
  info: (msg: string, data?: object) => log('info', msg, data),
  warn: (msg: string, data?: object) => log('warn', msg, data),
  error: (msg: string, data?: object) => log('error', msg, data),
};

function log(level: LogLevel, message: string, data?: object) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  console[level](prefix, message, data ?? '');
}
```

## Backend Logging (Go)

```go
// pkg/utils/logger/logger.go
package logger

import (
    "log/slog"
    "os"
)

var Log *slog.Logger

func Init(level string) {
    var logLevel slog.Level
    switch level {
    case "debug":
        logLevel = slog.LevelDebug
    case "info":
        logLevel = slog.LevelInfo
    case "warn":
        logLevel = slog.LevelWarn
    case "error":
        logLevel = slog.LevelError
    default:
        logLevel = slog.LevelInfo
    }

    Log = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: logLevel,
    }))
}

// Usage:
// logger.Log.Info("config applied", "commands", len(cmds), "duration", elapsed)
```

---
