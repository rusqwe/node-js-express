import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { eventBus } from '../utils/eventBus.js';

class AppError extends Error {
    status: number;

    constructor(message: string, status: number = 500) {
        super(message);
        this.status = status;
        this.name = 'AppError';
    }
}

export { AppError };

// Middleware для обработки ошибок
function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Zod-ошибки валидации
    if (err instanceof z.ZodError) {

        // Вызываем событие о валидационной ошибке
        eventBus.emit('validation:error', {
            message: err.message,
            details: err.issues,
            timestamp: new Date().toISOString(),
        });
        res.status(400).json({
            error: 'Validation failed',
            details: err.issues.map((issue) => ({
                message: issue.message,
                path: issue.path,
                code: issue.code,
            })),
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Пользовательские ошибки с status
    if (err instanceof AppError) {
        eventBus.emit('server:error', {
            message: err.message,
            status: err.status,
            timestamp: new Date().toISOString(),
        });

        res.status(err.status).json({
            error: err.message,
            message: '',
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Generic ошибка

    eventBus.emit('server:error', {
        message: err.message,
        status: 500,
        timestamp: new Date().toISOString(),
    });

    res.status(500).json({
        error: err.message || 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString(),
    });
}

export default errorHandler;
