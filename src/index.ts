import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import compression from 'compression';
import { eventBus } from './utils/eventBus.js';
import taskRouter from './routes/task.js';
import download from './routes/download.js';
import jsonRouter from './routes/json.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const port = process.env.PORT || 3001;

// ============================================
// Пример 1: Подписка на событие (on)
// ============================================
const cleanupValidation = eventBus.on('validation:error', (data: unknown) => {
    const obj = data as { message?: string };
    console.log('[EVENT] Validation error caught:', obj.message ?? data);
});

// ============================================
// Пример 2: Одноразовая подписка (once)
// ============================================
eventBus.once('server:error', (data: unknown) => {
    const obj = data as { message?: string };
    console.log('[EVENT-ONCE] First server error occurred:', obj.message);
    // После первого вызова эта подписка автоматически удалится
});

// ============================================
// Пример 3: Отписка от события (off/cleanup)
// ============================================
// Если нужно удалить подписку вручную:
// eventBus.off('validation:error', callbackFunction);
// Либо использовать функцию очистки, которую возвращает eventBus.on():
// cleanupValidation();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Для обработки данных из HTML-форм(вложености) (application/x-www-form-urlencoded)
app.use(compression()); // Автоматически сжимает все ответы
app.use('/api/tasks', taskRouter);
app.use('/api/download', download);
app.use('/api/json', jsonRouter);
app.use(errorHandler);
// Экспорт app для тестирования
export { app };

app.listen(port, () => {
    console.log(`server runing`);
});
