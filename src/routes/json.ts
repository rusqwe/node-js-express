import express, { Request, Response, NextFunction } from 'express';
//import errorHandler from '../middleware/errorHandler.js';
import { loadFilePath, listFiles, clearCacheFiles } from '../middleware/fileReader.js';

const router = express.Router();
const baseDirJSON = process.env.JSONS_DIR || 'JSONs';

// GET /json/list — получить список файлов
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
    console.log('/list');
    try {
        const files = await listFiles(baseDirJSON);
        res.json(files);
    } catch (err) {
        next(err);
    }
});

// GET /json/:fileName — получить JSON-файл по имени из папки JSONs
router.get('/:fileName', async (req: Request, res: Response, next: NextFunction) => {
    console.log('/:fileName');
    try {

        const fileName = req.params.fileName as string;
        const data = await loadFilePath(fileName);
        res.json(JSON.parse(data));
    } catch (err) {
        next(err);
    }
});

// POST /json/cache/clear — очистить кэш файлов
router.post('/cache/clear', (req: Request, res: Response) => {
    clearCacheFiles();
    res.json({ message: 'Cache cleared' });
});

//router.use(errorHandler);

export default router;
