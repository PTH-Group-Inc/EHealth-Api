import { Request, Response, NextFunction } from "express";
import { asyncHandler } from '../../utils/asyncHandler.util';
import { UserImportService } from "../../services/Facility Management/user-import.service";
import { AppError } from "../../utils/app-error.util";
import { UserRepository } from "../../repository/Core/user.repository";

export class UserImportController {
    /**
     * Upload và Validate File
     */
    static validateImport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                throw new AppError(400, 'FILE_MISSING', 'Vui lòng đính kèm file CSV hoặc Excel');
            }

            const result = await UserImportService.validateImport(
                req.file.buffer,
                req.file.mimetype,
                req.file.originalname
            );

            res.status(200).json({
                success: true,
                message: "Đã phân tích file",
                data: result
            });
    });

    /**
     * Upload và Execute File để Import User thực sự
     */
    static executeImport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            if (!req.file) {
                throw new AppError(400, 'FILE_MISSING', 'Vui lòng đính kèm file CSV hoặc Excel');
            }

            const adminId = (req as any).auth?.user_id || 'SYSTEM';
            const ipAddress = req.ip || req.connection.remoteAddress || null;
            const userAgent = req.get('User-Agent') || null;

            const result = await UserImportService.executeImport(
                req.file.buffer,
                req.file.mimetype,
                req.file.originalname,
                adminId,
                ipAddress,
                userAgent
            );

            res.status(200).json({
                success: true,
                message: `Import thành công ${result.valid_count} người dùng.`,
                data: result
            });
    });

    /**
     * Xem lịch sử  Import
     */
    static getImportHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const history = await UserRepository.getImportHistory();

            res.status(200).json({
                success: true,
                data: history
            });
    });
}
