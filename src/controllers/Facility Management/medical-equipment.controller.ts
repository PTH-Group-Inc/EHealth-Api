import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { MedicalEquipmentService } from '../../services/Facility Management/medical-equipment.service';
import { MaintenanceLogService } from '../../services/Facility Management/maintenance-log.service';
import {
    CreateEquipmentInput,
    UpdateEquipmentInput,
    AssignRoomInput,
    CreateMaintenanceLogInput,
    UpdateMaintenanceLogInput
} from '../../models/Facility Management/medical-equipment.model';
import { EQUIPMENT_CONFIG } from '../../constants/medical-equipment.constant';

export class MedicalEquipmentController {
    /**
     * Lấy danh sách thiết bị y tế
     */
    static getEquipments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const {
                facility_id, branch_id, room_id, status, search,
                page, limit
            } = req.query as Record<string, string>;

            const data = await MedicalEquipmentService.getEquipments(
                facility_id,
                branch_id,
                room_id,
                status,
                search,
                page ? parseInt(page) : EQUIPMENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : EQUIPMENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Lấy chi tiết thiết bị
     */
    static getEquipmentById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const data = await MedicalEquipmentService.getEquipmentById(id);
            res.status(200).json({ success: true, data });
    });

    /**
     * Tạo mới thiết bị
     */
    static createEquipment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const input: CreateEquipmentInput = req.body;
            const data = await MedicalEquipmentService.createEquipment(input);
            res.status(201).json({
                success: true,
                message: 'Tạo thiết bị y tế thành công.',
                data
            });
    });

    /**
     * Cập nhật thông tin thiết bị
     */
    static updateEquipment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: UpdateEquipmentInput = req.body;
            const data = await MedicalEquipmentService.updateEquipment(id, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật thiết bị thành công.',
                data
            });
    });

    /**
     * Cập nhật trạng thái thiết bị
     */
    static updateStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const { status } = req.body as { status: string };
            const data = await MedicalEquipmentService.updateStatus(id, status);
            res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái thiết bị thành: ${status}.`,
                data
            });
    });

    /**
     * Gán / thu hồi phòng cho thiết bị
     */
    static assignRoom = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: AssignRoomInput = req.body;
            const data = await MedicalEquipmentService.assignRoom(id, input);
            res.status(200).json({
                success: true,
                message: input.room_id
                    ? 'Đã gán thiết bị vào phòng thành công.'
                    : 'Đã thu hồi thiết bị về kho thành công.',
                data
            });
    });

    /**
     * Xóa mềm thiết bị
     */
    static deleteEquipment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            await MedicalEquipmentService.deleteEquipment(id);
            res.status(200).json({
                success: true,
                message: 'Đã xóa thiết bị thành công.'
            });
    });

    // ==================== MAINTENANCE LOGS ====================

    /**
     * Lấy lịch sử bảo trì của thiết bị
     */
    static getMaintenanceLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const { page, limit } = req.query as Record<string, string>;

            const data = await MaintenanceLogService.getLogsByEquipmentId(
                id,
                page ? parseInt(page) : EQUIPMENT_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : EQUIPMENT_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
    });

    /**
     * Tạo mới log bảo trì
     */
    static createMaintenanceLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params as { id: string };
            const input: CreateMaintenanceLogInput = req.body;
            const data = await MaintenanceLogService.createLog(id, input);
            res.status(201).json({
                success: true,
                message: 'Tạo bản ghi bảo trì thành công.',
                data
            });
    });

    /**
     * Cập nhật log bảo trì
     */
    static updateMaintenanceLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { logId } = req.params as { logId: string };
            const input: UpdateMaintenanceLogInput = req.body;
            const data = await MaintenanceLogService.updateLog(logId, input);
            res.status(200).json({
                success: true,
                message: 'Cập nhật bản ghi bảo trì thành công.',
                data
            });
    });

    /**
     * Xóa log bảo trì
     */
    static deleteMaintenanceLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { logId } = req.params as { logId: string };
            await MaintenanceLogService.deleteLog(logId);
            res.status(200).json({
                success: true,
                message: 'Đã xóa bản ghi bảo trì thành công.'
            });
    });
}
