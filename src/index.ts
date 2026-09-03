import 'dotenv/config';
import cors from 'cors';
import express, { Express } from 'express';
import compression from 'compression';
import { eventBus } from './utils/eventBus.js';
import taskRouter from './routes/task.js';
import downloadRouter from './routes/download.js';
import jsonRouter from './routes/json.js';
import healthRouter, { setShutdownState } from './routes/health.js';
import errorHandler from './middleware/errorHandler.js';
import { closePool } from './db/pool.js';

const app = express();
const port = process.env.PORT || 3001;


// Подписка на событие (on)
const cleanupValidation = eventBus.on('validation:error', (data: unknown) => {
    const obj = data as { message?: string };
    console.log('[EVENT] Validation error caught:', obj.message ?? data);

});
// Если нужно удалить подписку вручную:
// eventBus.off('validation:error', callbackFunction);
// Либо использовать функцию очистки, которую возвращает eventBus.on():
// cleanupValidation();
// Одноразовая подписка (once)
eventBus.once('server:error', (data: unknown) => {
    const obj = data as { message?: string };
    console.log('[EVENT-ONCE] First server error occurred:', obj.message);

});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Для обработки данных из HTML-форм(вложености) (application/x-www-form-urlencoded) formData
app.use(compression());
app.use('/api/tasks', taskRouter);
app.use('/api/download', downloadRouter);
app.use('/api/json', jsonRouter);
app.use('/api/health', healthRouter);

app.use(errorHandler);

// ================= Graceful Shutdown =================
// Флаг для health check — сигнализирует, что сервер завершает работу
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let server: any = null;

// Обработчик сигналов SIGTERM / SIGINT
const shutdownHandler = async (signal: string) => {
    console.log(`\n[${signal}] Received. Starting graceful shutdown...`);
    setShutdownState(true);

    if (server) {
        // Перестаем принимать новые запросы
        server.close(async () => {
            console.log('[shutdown] HTTP server closed');

            // Закрываем пул DB соединений
            try {
                await closePool();
                console.log('[shutdown] Database pool closed');
            } catch (err) {
                console.error('[shutdown] Error closing DB pool:', err);
            }

            // Очищаем event listeners
            eventBus.removeAllListeners();
            console.log('[shutdown] Event listeners cleaned up');

            process.exit(0);
        });

        // Таймаут — принудительный выход, если запросы зависли
        setTimeout(() => {
            console.error('[shutdown] Forced shutdown: timeout reached');
            process.exit(1);
        }, 30_000);
    }
};

// SIGTERM — Docker stop, Kubernetes, systemd
process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
// SIGINT — Ctrl+C
process.on('SIGINT', () => shutdownHandler('SIGINT'));

// uncaughtException / unhandledRejection — аварийный выход
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    process.exit(1);
});

// ================= Start Server =================
server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Press Ctrl+C to stop');
});

// Экспорт app и server для тестирования
export { app, server };
