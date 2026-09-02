import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as taskService from '../services/taskService.js';
import type { Task } from '../services/taskService.js';

const router = express.Router();

// Схема валидации задачи
const taskSchema = z.object({
    task_id: z.number().min(1),
    task_struct_code: z.number().min(1),
    task_name: z.string(),
    module_id: z.number().min(1),
    module_name: z.string(),
    developer_id: z.number().min(1),
    developer_login: z.string(),
    developer_shortname: z.string(),
    role_snames: z.string(),
    role_count: z.number().min(1),
    row_is_ready: z.boolean()
});

// GET /api/tasks — получить все задачи (с поиском по taskId)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskId = req.query.task_id as string | undefined;
        const tasks = await taskService.getTasks(taskId);
        res.json(tasks);
    } catch (err) {
        next(err);
    }
});

// GET /api/tasks/:id — получить задачу по ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskId = req.params.id as string;
        const task = await taskService.getTaskById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        next(err);
    }
});

// POST /api/tasks — создать задачу
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = taskSchema.parse(req.body) as Task;
        const task = await taskService.createTask(validatedData);
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});

// PUT /api/tasks/:id — обновить задачу
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskId = req.params.id as string;
        const validatedData = taskSchema.parse(req.body) as Task;
        const task = await taskService.updateTask(taskId, validatedData);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/tasks/:id — удалить задачу
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const taskId = req.params.id as string;
        const deleted = await taskService.deleteTask(taskId);
        if (!deleted) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
