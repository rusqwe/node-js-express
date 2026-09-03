import express, { Request, Response, NextFunction } from 'express';
import { request as getRequest } from '../db/pool.js';

const router = express.Router();

// Флаг статуса shutdown (синхронизируется с index.ts)
let isShuttingDown = false;

// Устанавливает флаг (вызывается из index.ts при получении SIGTERM/SIGINT)
export function setShutdownState(value: boolean): void {
    isShuttingDown = value;
}

// GET /health
router.get('/', async (req: Request, res: Response) => {
    const result = { status: 'nok', connect: false };
    // Если сервер завершает работу — сразу 503
    if (isShuttingDown) {
        result.status = 'shutting_down';
        res.status(503).json(result);
        return;
    }

    try {
        result.status = 'ok';
        const reqDB = await getRequest();
        await reqDB.query('SELECT 1');
        result.connect = true;
        res.json(result);
    } catch (err) {
        res.status(503).json(result);
    }
});

export default router;
