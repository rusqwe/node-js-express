import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import * as taskService from '../services/taskService.js';
import type { Task } from '../services/taskService.js';

// Мокируем db/pool до импорта taskService
vi.mock('../db/pool.js', () => ({
    sql: {
        Request: vi.fn(),
        UniqueIdentifier: 'uniqueidentifier',
        NVarChar: 'nvarchar',
        Int: 'int',
        config: {},
        ConnectionPool: vi.fn(),
    },
    getPool: vi.fn(),
    closePool: vi.fn(),
    request: vi.fn(),
}));

vi.mock('../services/taskService.js', () => ({
    getTasks: vi.fn(),
    getTaskById: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
}));

const mockGetTasks = vi.mocked(taskService.getTasks);
const mockGetTaskById = vi.mocked(taskService.getTaskById);
const mockCreateTask = vi.mocked(taskService.createTask);
const mockUpdateTask = vi.mocked(taskService.updateTask);
const mockDeleteTask = vi.mocked(taskService.deleteTask);

const sampleTask: Task = {
    task_id: 1,
    task_struct_code: 100,
    task_name: 'Test Task',
    module_id: 1,
    module_name: 'Module',
    developer_id: 1,
    developer_login: 'admin',
    developer_shortname: 'Admin',
    role_snames: 'Admin',
    role_count: '1',
    row_is_ready: 'Y',
};

beforeAll(() => {
    vi.clearAllMocks();
});

describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
        mockGetTasks.mockResolvedValue([sampleTask]);
        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('task_name', 'Test Task');
    });

    it('should return tasks filtered by taskId', async () => {
        mockGetTasks.mockResolvedValue([sampleTask]);
        const res = await request(app).get('/api/tasks?task_id=1');
        expect(res.status).toBe(200);
        expect(mockGetTasks).toHaveBeenCalledWith('1');
    });

    it('should return empty array when no tasks match', async () => {
        mockGetTasks.mockResolvedValue([]);
        const res = await request(app).get('/api/tasks?task_id=999');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });
});

describe('GET /api/tasks/:id', () => {
    it('should return a task by id', async () => {
        mockGetTaskById.mockResolvedValue(sampleTask);
        const res = await request(app).get('/api/tasks/1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('task_id', 1);
        expect(res.body).toHaveProperty('task_name');
    });

    it('should return 404 for non-existent task', async () => {
        mockGetTaskById.mockResolvedValue(null);
        const res = await request(app).get('/api/tasks/999');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Task not found');
    });
});

describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
        const newTask: Task = {
            ...sampleTask,
            task_id: 999,
            task_name: 'Новая задача',
        };
        mockCreateTask.mockResolvedValue(newTask);
        const res = await request(app)
            .post('/api/tasks')
            .send({ task_name: 'Новая задача' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('task_id');
        expect(res.body.task_name).toBe('Новая задача');
    });

    it('should return 400 for missing task_name', async () => {
        const res = await request(app).post('/api/tasks').send({
            task_id: 1,
        });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Validation failed');
    });
});

describe('PUT /api/tasks/:id', () => {
    it('should update an existing task', async () => {
        const updatedTask: Task = {
            ...sampleTask,
            task_name: 'Обновлённая задача',
        };
        mockUpdateTask.mockResolvedValue(updatedTask);
        const res = await request(app).put('/api/tasks/1').send({
            ...sampleTask,
            task_name: 'Обновлённая задача',
        });
        expect(res.status).toBe(200);
        expect(res.body.task_name).toBe('Обновлённая задача');
    });

    it('should return 404 for non-existent task', async () => {
        mockUpdateTask.mockResolvedValue(null);
        const res = await request(app).put('/api/tasks/999').send({
            task_name: 'Не существует',
        });
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Task not found');
    });
});

describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
        mockDeleteTask.mockResolvedValue(true);
        const res = await request(app).delete('/api/tasks/2');
        expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent task', async () => {
        mockDeleteTask.mockResolvedValue(false);
        const res = await request(app).delete('/api/tasks/999');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Task not found');
    });
});
