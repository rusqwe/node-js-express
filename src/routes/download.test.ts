import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('GET /api/download/list', () => {
  it('возвращает список файлов', async () => {
    const res = await request(app).get('/api/download/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/download/:fileName', () => {
  it('должен возвращать 404 для несуществующего файла', async () => {
    const res = await request(app).get('/api/download/nonexistent.txt');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('должен предотвращать обход пути с закодированными символами', async () => {
    const res = await request(app).get('/api/download/%2e%2e%2fpackage.json');
    // Express может нормализовать путь, но fileReader должен защитить от traversal
    expect([400, 404]).toContain(res.status);
  });
});
