const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logsDir = path.join(process.cwd(), 'logs');

const dailyRotate = new transports.DailyRotateFile({
  dirname: logsDir,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  zippedArchive: false,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()} ${message}`)
  ),
});

const logger = createLogger({
  level: 'info',
  transports: [dailyRotate],
});

// En modo test no logs
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

module.exports = logger;
