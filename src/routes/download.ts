import express, { Request, Response, NextFunction } from 'express';
//import errorHandler from '../middleware/errorHandler.js';
import { listFiles, getFilePath } from '../middleware/fileReader.js';

const router = express.Router();
const baseDirJSON = process.env.FILES_DIR || 'Files';
// GET /download/list — получить список файлов
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
    console.log('/list');
    try {
        const files = await listFiles(baseDirJSON);
        res.json(files);
    } catch (err) {
        next(err);
    }
});
// GET /json/download/:fileName — скачать файл из папки files
router.get('/:fileName', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fileName = req.params.fileName as string;
        const { fullPath, safeName } = await getFilePath(fileName);
        res.download(fullPath, safeName);
    } catch (err) {
        next(err);
    }
});

//router.use(errorHandler);

export default router;
