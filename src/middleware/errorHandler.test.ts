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

describe('errorHandler middleware', () => {
  it('should handle Zod validation errors', async () => {
    const app = createTestApp();
    const res = await request(app).post('/zod-error').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body).toHaveProperty('details');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should handle AppError with custom status', async () => {
    const app = createTestApp();
    const res = await request(app).post('/app-error').send({});
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Custom error message');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should handle generic errors with 500 status', async () => {
    const app = createTestApp();
    const res = await request(app).get('/generic-error');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should include timestamp in all error responses', async () => {
    const app = createTestApp();

    const zodRes = await request(app).post('/zod-error').send({});
    expect(new Date(zodRes.body.timestamp)).not.toBeNaN();

    const appRes = await request(app).post('/app-error').send({});
    expect(new Date(appRes.body.timestamp)).not.toBeNaN();

    const genericRes = await request(app).get('/generic-error');
    expect(new Date(genericRes.body.timestamp)).not.toBeNaN();
  });
});

describe('AppError class', () => {
  it('should have correct name', () => {
    const err = new AppError('Test error');
    expect(err.name).toBe('AppError');
  });

  it('should default to status 500', () => {
    const err = new AppError('Test error');
    expect(err.status).toBe(500);
  });

  it('should accept custom status', () => {
    const err = new AppError('Not found', 404);
    expect(err.status).toBe(404);
  });

  it('should extend Error', () => {
    const err = new AppError('Test');
    expect(err).toBeInstanceOf(Error);
  });
});
