import { readFile, access, readdir } from 'node:fs/promises';
import path from 'path';
import { AppError } from './errorHandler.js';
import { Dirent } from 'node:fs';

interface CacheEntry {
    data: string;
    timestamp: number;
}

const baseDirJSON = process.env.JSONS_DIR || 'JSONs';
const filesDir = process.env.FILES_DIR || 'Files';
const CACHE_TTL = 5 * 60 * 1000; // 5 минут
const fileCache = new Map<string, CacheEntry>();

async function checkFile(filePath: string): Promise<void> {
    try {
        await access(filePath);
    } catch {
        throw new AppError('File not found ' + filePath, 404);
    }
}

export async function loadFilePath(filePath: string): Promise<string> {
    const fullPath = path.resolve(baseDirJSON, filePath);

    // Защита от path traversal (../)
    if (!fullPath.startsWith(path.resolve(baseDirJSON))) {
        throw new AppError('Invalid file path', 400);
    }

    const cached = fileCache.get(fullPath);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('кэш');

        return cached.data;
    }

    await checkFile(fullPath);

    const data = await readFile(fullPath, 'utf8');
    fileCache.set(fullPath, { data, timestamp: Date.now() });
    console.log('не кэш');
    return data;
}

export async function getFilePath(fileName: string): Promise<{ fullPath: string; safeName: string }> {
    const fullPath = path.resolve(filesDir, fileName);
    const safeName = path.basename(fileName);

    // Защита от path traversal (../)
    if (!fullPath.startsWith(path.resolve(filesDir))) {
        throw new AppError('Invalid file path', 400);
    }

    await checkFile(fullPath);

    return { fullPath, safeName };
}

export async function listFiles(baseDir: string): Promise<Dirent[]> {
    const fullPath = path.resolve(baseDir, '');
    const data = await readdir(fullPath, { withFileTypes: true });
    return data;
}

export function clearCacheFiles(): void {
    fileCache.clear();
}
export default { loadFilePath, listFiles, clearCacheFiles };
