/**
 * Simple logger utility for production-ready logging
 * In production, you might want to integrate with services like Winston, Pino, or cloud logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private shouldLog(level: LogLevel): boolean {
        if (process.env.NODE_ENV === 'test') return false;
        if (process.env.NODE_ENV === 'production' && level === 'debug') return false;
        return true;
    }

    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    info(message: string, meta?: any): void {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, meta));
        }
    }

    warn(message: string, meta?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    error(message: string, error?: Error | any): void {
        if (this.shouldLog('error')) {
            const meta = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error;
            console.error(this.formatMessage('error', message, meta));
        }
    }

    debug(message: string, meta?: any): void {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }
}

export default new Logger();
