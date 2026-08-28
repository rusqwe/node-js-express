import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('GET /api/json/list', () => {
  it('should return list of JSON files', async () => {
    const res = await request(app).get('/api/json/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should return files with correct properties', async () => {
    const res = await request(app).get('/api/json/list');
    expect(res.status).toBe(200);
    // Dirent должен иметь свойство name
    const fileNames = res.body.map((f: any) => f.name);
    expect(fileNames).toContain('config.json');
    expect(fileNames).toContain('users.json');
  });
});

describe('GET /api/json/:fileName', () => {
  it('should return a JSON file by name', async () => {
    const res = await request(app).get('/api/json/config.json');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('should return valid JSON data from users.json', async () => {
    const res = await request(app).get('/api/json/users.json');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it('should return 404 for non-existent file', async () => {
    const res = await request(app).get('/api/json/nonexistent.json');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should prevent path traversal with encoded characters', async () => {
    const res = await request(app).get('/api/json/%2e%2e%2fpackage.json');
    // Express может нормализовать путь, но fileReader должен защитить от traversal
    expect([400, 404]).toContain(res.status);
  });
});

describe('POST /api/json/cache/clear', () => {
  it('should clear the file cache', async () => {
    const res = await request(app).post('/api/json/cache/clear');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Cache cleared');
  });
});
