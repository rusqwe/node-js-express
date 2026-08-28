import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import type { Task } from '../routes/task';

describe('GET /api/tasks', () => {
  it('should return all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return tasks filtered by title', async () => {
    const res = await request(app).get('/api/tasks?title=Express');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((task: Task) => {
      expect(task.title.toLowerCase()).toContain('express');
    });
  });

  it('should return empty array when no tasks match', async () => {
    const res = await request(app).get('/api/tasks?title=NonExistent');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});

describe('GET /api/tasks/:id', () => {
  it('should return a task by id', async () => {
    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', '1');
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('status');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).get('/api/tasks/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Task not found');
  });
});

describe('POST /api/tasks', () => {
  it('should create a new task with valid data', async () => {
    const newTask = {
      title: 'Новая задача',
      description: 'Тест создания задачи',
      status: 'todo' as const,
    };
    const res = await request(app).post('/api/tasks').send(newTask);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(newTask.title);
    expect(res.body.description).toBe(newTask.description);
    expect(res.body.status).toBe(newTask.status);
  });

  it('should return 400 for missing title', async () => {
    const res = await request(app).post('/api/tasks').send({
      description: 'Без заголовка',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('should return 400 for invalid status', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Невалидный статус',
      status: 'invalid_status',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('should use default status when not provided', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Задача без статуса',
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('todo');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('should update an existing task', async () => {
    const res = await request(app).put('/api/tasks/1').send({
      title: 'Обновлённая задача',
      status: 'in_progress',
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Обновлённая задача');
    expect(res.body.status).toBe('in_progress');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).put('/api/tasks/nonexistent').send({
      title: 'Не существует',
    });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Task not found');
  });

  it('should partially update a task', async () => {
    const res = await request(app).put('/api/tasks/3').send({
      status: 'done',
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    // Оригинальный заголовок должен сохраниться
    expect(res.body.title).toBe('Добавить валидацию');
  });

  it('should return 400 for invalid status update', async () => {
    const res = await request(app).put('/api/tasks/1').send({
      status: 'invalid',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('should delete a task', async () => {
    const res = await request(app).delete('/api/tasks/2');
    expect(res.status).toBe(204);
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Task not found');
  });

  it('should not return the deleted task in subsequent requests', async () => {
    // Удаляем задачу 3
    await request(app).delete('/api/tasks/3');
    // Проверяем, что её больше нет
    const res = await request(app).get('/api/tasks/3');
    expect(res.status).toBe(404);
  });
});
