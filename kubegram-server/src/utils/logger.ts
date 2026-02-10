import winston from 'winston';
import config from '../config/env';

const logLevel = config.isDevelopment ? 'debug' : 'info';

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

export const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'kubegram-server' },
    transports: [
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

export default logger;
