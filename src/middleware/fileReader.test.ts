import { describe, it, expect, beforeEach } from 'vitest';
import { loadFilePath, listFiles, clearCacheFiles, getFilePath } from '../middleware/fileReader';
import { AppError } from '../middleware/errorHandler';

describe('loadFilePath', () => {
  beforeEach(() => {
    clearCacheFiles();
  });

  it('загружает JSON файл', async () => {
    const data = await loadFilePath('config.json');
    expect(data).toBeDefined();
    expect(typeof data).toBe('string');
  });

  it('возвращает распарсенное содержимое JSON', async () => {
    const data = await loadFilePath('config.json');
    const parsed = JSON.parse(data);
    expect(parsed).toBeDefined();
  });

  it('выбрасывает AppError для несуществующего файла', async () => {
    await expect(loadFilePath('nonexistent.json')).rejects.toThrow(AppError);
    await expect(loadFilePath('nonexistent.json')).rejects.toThrow('File not found');
  });

  it('предотвращает обход пути', async () => {
    await expect(loadFilePath('../../package.json')).rejects.toThrow(AppError);
    await expect(loadFilePath('../../package.json')).rejects.toThrow('Invalid file path');
  });

  it('кэширует содержимое файла', async () => {
    // Первая загрузка (без кэша)
    const data1 = await loadFilePath('config.json');
    // Вторая загрузка (из кэша)
    const data2 = await loadFilePath('config.json');
    expect(data1).toBe(data2);
  });

  it('очищает кэш', async () => {
    await loadFilePath('config.json');
    clearCacheFiles();
    // После очистки кэша следующая загрузка должна работать корректно
    const data = await loadFilePath('config.json');
    expect(data).toBeDefined();
  });
});

describe('getFilePath', () => {
  it('возвращает fullPath и safeName', async () => {
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

  it('предотвращает обход пути', async () => {
    await expect(getFilePath('../../package.json')).rejects.toThrow(AppError);
    await expect(getFilePath('../../package.json')).rejects.toThrow('Invalid file path');
  });

  it('выбрасывает AppError для несуществующего файла', async () => {
    await expect(getFilePath('nonexistent.txt')).rejects.toThrow(AppError);
    await expect(getFilePath('nonexistent.txt')).rejects.toThrow('File not found');
  });
});

describe('listFiles', () => {
  it('возвращает массив Dirent', async () => {
    const files = await listFiles('JSONs');
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  it('включает известные JSON файлы', async () => {
    const files = await listFiles('JSONs');
    const names = files.map((f: any) => f.name);
    expect(names).toContain('config.json');
    expect(names).toContain('users.json');
  });
});
