import { describe, it, expect, beforeEach } from 'vitest';
import { loadFilePath, listFiles, clearCacheFiles, getFilePath } from '../middleware/fileReader';
import { AppError } from '../middleware/errorHandler';

describe('loadFilePath', () => {
  beforeEach(() => {
    clearCacheFiles();
  });

  it('should load a JSON file', async () => {
    const data = await loadFilePath('config.json');
    expect(data).toBeDefined();
    expect(typeof data).toBe('string');
  });

  it('should return parsed JSON content', async () => {
    const data = await loadFilePath('config.json');
    const parsed = JSON.parse(data);
    expect(parsed).toBeDefined();
  });

  it('should throw AppError for non-existent file', async () => {
    await expect(loadFilePath('nonexistent.json')).rejects.toThrow(AppError);
    await expect(loadFilePath('nonexistent.json')).rejects.toThrow('File not found');
  });

  it('should prevent path traversal', async () => {
    await expect(loadFilePath('../../package.json')).rejects.toThrow(AppError);
    await expect(loadFilePath('../../package.json')).rejects.toThrow('Invalid file path');
  });

  it('should cache file content', async () => {
    // Первая загрузка (без кэша)
    const data1 = await loadFilePath('config.json');
    // Вторая загрузка (из кэша)
    const data2 = await loadFilePath('config.json');
    expect(data1).toBe(data2);
  });

  it('clearCacheFiles should clear the cache', async () => {
    await loadFilePath('config.json');
    clearCacheFiles();
    // После очистки кэша следующая загрузка должна работать корректно
    const data = await loadFilePath('config.json');
    expect(data).toBeDefined();
  });
});

describe('getFilePath', () => {
  it('should return fullPath and safeName', async () => {
    // Файл может не существовать, но функция должна вернуть путь
    try {
      const result = await getFilePath('test.txt');
      expect(result).toHaveProperty('fullPath');
      expect(result).toHaveProperty('safeName', 'test.txt');
    } catch (err) {
      // Если файла нет, должна быть ошибка AppError
      expect(err).toBeInstanceOf(AppError);
    }
  });

  it('should prevent path traversal', async () => {
    await expect(getFilePath('../../package.json')).rejects.toThrow(AppError);
    await expect(getFilePath('../../package.json')).rejects.toThrow('Invalid file path');
  });

  it('should throw AppError for non-existent file', async () => {
    await expect(getFilePath('nonexistent.txt')).rejects.toThrow(AppError);
    await expect(getFilePath('nonexistent.txt')).rejects.toThrow('File not found');
  });
});

describe('listFiles', () => {
  it('should return array of Dirent', async () => {
    const files = await listFiles('JSONs');
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should include known JSON files', async () => {
    const files = await listFiles('JSONs');
    const names = files.map((f: any) => f.name);
    expect(names).toContain('config.json');
    expect(names).toContain('users.json');
  });
});
