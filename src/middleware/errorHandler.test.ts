import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import errorHandler from '../middleware/errorHandler.js';

// Создаём тестовое приложение с маршрутом, который вызывает ошибки
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Маршрут для тестирования Zod ошибки
  app.post('/zod-error', (req, res, next) => {
    const schema = z.object({ name: z.string().min(1) });
    try {
      schema.parse(req.body);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // Маршрут для тестирования AppError
  app.post('/app-error', (req, res, next) => {
    try {
      throw new AppError('Custom error message', 403);
    } catch (err) {
      next(err);
    }
  });

  // Маршрут для тестирования generic ошибки
  app.get('/generic-error', () => {
    throw new Error('Unexpected error');
  });

  // Подключаем errorHandler
  app.use(errorHandler);

  return app;
}

describe('middleware errorHandler', () => {
  it('должен обрабатывать ошибки валидации Zod', async () => {
    const app = createTestApp();
    const res = await request(app).post('/zod-error').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body).toHaveProperty('details');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body).toHaveProperty('timestamp');
  });

  it('должен обрабатывать AppError с пользовательским статусом', async () => {
    const app = createTestApp();
    const res = await request(app).post('/app-error').send({});
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Custom error message');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('обрабатывает общие ошибки со статусом 500', async () => {
    const app = createTestApp();
    const res = await request(app).get('/generic-error');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('включает метку времени во все ответы об ошибках', async () => {
    const app = createTestApp();

    const zodRes = await request(app).post('/zod-error').send({});
    expect(new Date(zodRes.body.timestamp)).not.toBeNaN();

    const appRes = await request(app).post('/app-error').send({});
    expect(new Date(appRes.body.timestamp)).not.toBeNaN();

    const genericRes = await request(app).get('/generic-error');
    expect(new Date(genericRes.body.timestamp)).not.toBeNaN();
  });
});

describe('Класс AppError', () => {
  it('должен иметь правильное имя', () => {
    const err = new AppError('Test error');
    expect(err.name).toBe('AppError');
  });

  it('должен по умолчанию иметь статус 500', () => {
    const err = new AppError('Test error');
    expect(err.status).toBe(500);
  });

  it('должен принимать пользовательский статус', () => {
    const err = new AppError('Not found', 404);
    expect(err.status).toBe(404);
  });

  it('должен расширять Error', () => {
    const err = new AppError('Test');
    expect(err).toBeInstanceOf(Error);
  });
});
