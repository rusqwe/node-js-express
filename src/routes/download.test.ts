import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('GET /api/download/list', () => {
  it('should return list of files', async () => {
    const res = await request(app).get('/api/download/list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/download/:fileName', () => {
  it('should return 404 for non-existent file', async () => {
    const res = await request(app).get('/api/download/nonexistent.txt');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should prevent path traversal with encoded characters', async () => {
    const res = await request(app).get('/api/download/%2e%2e%2fpackage.json');
    // Express может нормализовать путь, но fileReader должен защитить от traversal
    expect([400, 404]).toContain(res.status);
  });
});
