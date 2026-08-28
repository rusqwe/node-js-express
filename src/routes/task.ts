import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import errorHandler from '../middleware/errorHandler.js';

const router = express.Router();

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
}

const tasks = new Map<string, Task>([
    [
        '1',
        {
            id: '1',
            title: 'Изучить Express',
            description: 'Прочитать документацию',
            status: 'done',
        },
    ],
    [
        '2',
        {
            id: '2',
            title: 'Написать CRUD',
            description: 'Реализовать роуты для задач',
            status: 'in_progress',
        },
    ],
    [
        '3',
        {
            id: '3',
            title: 'Добавить валидацию',
            description: 'Использовать Zod для схем',
            status: 'todo',
        },
    ],
]);

// Схема валидации задачи
const taskSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
});

// GET /api/tasks — получить все задачи (с поиском по title)
router.get('/', (_req: Request, res: Response) => {
    const query = (_req.query.title as string)?.toLowerCase();
    let tasksArray = Array.from(tasks.values());
    if (query) {
        tasksArray = tasksArray.filter((t) =>
            t.title.toLowerCase().includes(query)
        );
    }
    res.json(tasksArray);
});

// GET /api/tasks/:id — получить задачу по ID
router.get('/:id', (req: Request, res: Response) => {
    const taskId = req.params.id as string;
    const task = tasks.get(taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});

// POST /api/tasks — создать задачу
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = taskSchema.parse(req.body);
        const id = crypto.randomUUID();
        const task: Task = { id, ...validatedData };
        tasks.set(id, task);
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});

// PUT /api/tasks/:id — обновить задачу
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const taskId = req.params.id as string;
    const task = tasks.get(taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    try {
        const validatedData = taskSchema.partial().parse(req.body);
        const updatedTask: Task = { ...task, ...validatedData };
        tasks.set(taskId, updatedTask);
        res.json(updatedTask);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/tasks/:id — удалить задачу
router.delete('/:id', (req: Request, res: Response) => {
    const taskId = req.params.id as string;
    const task = tasks.get(taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    tasks.delete(taskId);
    res.status(204).send();
});

router.use(errorHandler);

export default router;
