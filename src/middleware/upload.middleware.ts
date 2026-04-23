import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

// Giới hạn file 5MB
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isExcel = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls');

    if (isExcel) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
};

export const uploadExcel = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh'));
    }
};

export const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export const verifyFileSignature = (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
        return next();
    }

    const checkSignature = (file: Express.Multer.File) => {
        if (!file.buffer) return true; // Bypass if not memory storage
        
        const bytes = Array.from(file.buffer.subarray(0, 8))
            .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
            
        // Check images
        if (file.mimetype.startsWith('image/')) {
            const isJpeg = bytes.startsWith('FF D8 FF');
            const isPng = bytes.startsWith('89 50 4E 47 0D 0A 1A 0A');
            const isGif = bytes.startsWith('47 49 46 38 37 61') || bytes.startsWith('47 49 46 38 39 61');
            const isBmp = bytes.startsWith('42 4D');
            const isWebp = bytes.startsWith('52 49 46 46') && file.buffer.toString('ascii', 8, 12) === 'WEBP';
            
            return isJpeg || isPng || isGif || isBmp || isWebp;
        }

        // Check Excel
        if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
            const isXlsx = bytes.startsWith('50 4B 03 04'); // ZIP format used by XLSX
            const isXls = bytes.startsWith('D0 CF 11 E0 A1 B1 1A E1'); // OLE format used by XLS
            return isXlsx || isXls;
        }
        
        return true;
    }

    const files: Express.Multer.File[] = [];
    if (req.file) files.push(req.file);
    if (req.files) {
        if (Array.isArray(req.files)) {
            files.push(...req.files);
        } else {
            Object.values(req.files).forEach(fArray => files.push(...fArray));
        }
    }

    for (const file of files) {
        if (!checkSignature(file)) {
            res.status(400).json({ success: false, message: 'Invalid file signature. File content does not match its MIME type.' });
            return;
        }
    }

    next();
};
