const { createLogger, format, transports } = require('winston');

const { combine, timestamp, colorize, printf, json, errors } = format;

// Human-readable format for development
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `${timestamp} ${level}: ${message}\n${stack}`
      : `${timestamp} ${level}: ${message}`;
  })
);

// Structured JSON format for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const isDev = (process.env.NODE_ENV || 'development') === 'development';

const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
  ],
  // Do not exit on handled exceptions
  exitOnError: false,
});

module.exports = logger;
