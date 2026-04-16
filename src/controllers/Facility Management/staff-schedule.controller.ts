// src/controllers/Facility Management/staff-schedule.controller.ts
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { StaffScheduleService } from '../../services/Facility Management/staff-schedule.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';

export class StaffScheduleController {

    /**
     * Tạo lịch phân công
     */
    static createSchedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { user_id, medical_room_id, shift_id, working_date } = req.body;

            if (!user_id || !medical_room_id || !shift_id || !working_date) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_DATA', 'Thiếu thông tin phân công lịch bắt buộc');
            }

            const schedule = await StaffScheduleService.createSchedule({
                user_id,
                medical_room_id,
                shift_id,
                working_date,
                start_time: '',
                end_time: ''
            });

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: 'Phân công lịch làm việc thành công',
                data: schedule
            });
    });

    /**
     * Lấy danh sách lịch phân công
     */
    static getSchedules = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { user_id, shift_id, working_date, medical_room_id, branch_id } = req.query;
            const filters = {
                staff_schedules_id: req.query.staff_schedules_id?.toString(),
                user_id: user_id?.toString(),
                shift_id: shift_id?.toString(),
                working_date: working_date?.toString(),
                medical_room_id: medical_room_id?.toString(),
                branch_id: branch_id?.toString()
            };

            const schedules = await StaffScheduleService.getSchedules(filters);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                data: schedules
            });
    });

    /**
     * Lấy chi tiết lịch
     */
    static getScheduleById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const schedule = await StaffScheduleService.getScheduleById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, data: schedule });
    });

    /**
     * Lập lịch Calendar - Format nhóm theo ngày để FE tự map vào ô vuông
     */
    static getScheduleCalendar = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const { user_id, medical_room_id } = req.query;
            const filters = {
                user_id: user_id?.toString(),
                medical_room_id: medical_room_id?.toString()
            };

            const schedules = await StaffScheduleService.getSchedules(filters);

            const groupedData: Record<string, any[]> = {};

            schedules.forEach(schedule => {
                const d = new Date(schedule.working_date);
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                if (!groupedData[dateKey]) {
                    groupedData[dateKey] = [];
                }
                groupedData[dateKey].push(schedule);
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Dữ liệu Calendar phân theo nhóm ngày',
                data: groupedData
            });
    });

    /**
     * Lấy list lịch theo nhân viên 
     */
    static getSchedulesByStaff = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const schedules = await StaffScheduleService.getSchedules({ user_id: req.params.staffId as string });
            res.status(HTTP_STATUS.OK).json({ success: true, data: schedules });
    });

    /**
     * Lấy list lịch theo ngày
     */
    static getSchedulesByDate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const schedules = await StaffScheduleService.getSchedules({ working_date: req.params.date as string });
            res.status(HTTP_STATUS.OK).json({ success: true, data: schedules });
    });

    /**
     * Cập nhật thông tin lịch
     */
    static updateSchedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const updated = await StaffScheduleService.updateSchedule(id, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật lịch thành công', data: updated });
    });

    /**
     * Xóa lịch
     */
    static deleteSchedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await StaffScheduleService.deleteSchedule(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa lịch thành công' });
    });
    /**
     * Tạm ngưng lịch
     */
    static suspendSchedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const updated = await StaffScheduleService.suspendSchedule(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã tạm ngưng lịch làm việc thành công', data: updated });
    });

    /**
     * Mở lại lịch
     */
    static resumeSchedule = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const updated = await StaffScheduleService.resumeSchedule(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: 'Đã mở lại lịch làm việc thành công', data: updated });
    });
}
