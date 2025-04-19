const winston = require('winston');

// Define the custom format for logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'youtube-monitor' },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    // Write to all logs with level 'info' and below to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ]
});

// If we're not in production, also log to the console with prettier formatting
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = { logger };
