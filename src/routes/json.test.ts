import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('GET /api/json/list', () => {
  it('должен возвращать список JSON файлов', async () => {
    const res = await request(app).get('/api/json/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('должен возвращать файлы с правильными свойствами', async () => {
    const res = await request(app).get('/api/json/list');
    expect(res.status).toBe(200);
    // Dirent должен иметь свойство name
    const fileNames = res.body.map((f: any) => f.name);
    expect(fileNames).toContain('config.json');
    expect(fileNames).toContain('users.json');
  });
});

describe('GET /api/json/:fileName', () => {
  it('возвращает JSON файл по имени', async () => {
    const res = await request(app).get('/api/json/config.json');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('должен возвращать корректные JSON данные из users.json', async () => {
    const res = await request(app).get('/api/json/users.json');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('возвращает 404 для несуществующего файла', async () => {
    const res = await request(app).get('/api/json/nonexistent.json');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('должен предотвращать обход пути с закодированными символами', async () => {
    const res = await request(app).get('/api/json/%2e%2e%2fpackage.json');
    // Express может нормализовать путь, но fileReader должен защитить от traversal
    expect([400, 404]).toContain(res.status);
  });
});

describe('POST /api/json/cache/clear', () => {
  it('должен очищать кэш файлов', async () => {
    const res = await request(app).post('/api/json/cache/clear');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Cache cleared');
  });
});
