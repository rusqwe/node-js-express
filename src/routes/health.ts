import express, { Request, Response, NextFunction } from 'express';
import { request as getRequest } from '../db/pool.js';
const router = express.Router();

// GET /health 
router.get('/', async (req: Request, res: Response) => {
    const status = { work: true, database: false }
    try {
        status.work = true;
        const reqDB = await getRequest();
        await reqDB.query('SELECT 1');
        status.database = true;
        res.json(status);
    } catch (err) {
        res.status(503).json(status);
    }
});


export default router;
