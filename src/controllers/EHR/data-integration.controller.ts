import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { DataIntegrationService } from '../../services/EHR/data-integration.service';
import { DI_SUCCESS } from '../../constants/data-integration.constant';

export class DataIntegrationController {

    /** API 1: DS nguồn dữ liệu */
    static getDataSources = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const data = await DataIntegrationService.getDataSources();
            res.status(200).json({ success: true, message: DI_SUCCESS.SOURCES_FETCHED, data });
    });

    /** API 2: Thêm nguồn */
    static createDataSource = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.createDataSource(req.body, userId);
            res.status(201).json({ success: true, message: DI_SUCCESS.SOURCE_CREATED, data });
    });

    /** API 3: Cập nhật nguồn */
    static updateDataSource = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const sourceId = req.params.sourceId as string;
            const data = await DataIntegrationService.updateDataSource(sourceId, req.body);
            res.status(200).json({ success: true, message: DI_SUCCESS.SOURCE_UPDATED, data });
    });

    /** API 4: DS hồ sơ bên ngoài */
    static getExternalRecords = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const filters = {
                data_type: req.query.data_type as string | undefined,
                sync_status: req.query.sync_status as string | undefined,
                source_id: req.query.source_id as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await DataIntegrationService.getExternalRecords(patientId, filters);
            res.status(200).json({ success: true, message: DI_SUCCESS.RECORDS_FETCHED, ...data });
    });

    /** API 5: Nhập hồ sơ */
    static createExternalRecord = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.createExternalRecord(patientId, req.body, userId);
            res.status(201).json({ success: true, message: DI_SUCCESS.RECORD_CREATED, data });
    });

    /** API 6: Chi tiết */
    static getExternalRecordDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const recordId = req.params.recordId as string;
            const data = await DataIntegrationService.getExternalRecordDetail(patientId, recordId);
            res.status(200).json({ success: true, message: DI_SUCCESS.RECORD_DETAIL_FETCHED, data });
    });

    /** API 7: Cập nhật sync status */
    static updateSyncStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const recordId = req.params.recordId as string;
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.updateSyncStatus(patientId, recordId, req.body, userId);
            res.status(200).json({ success: true, message: DI_SUCCESS.STATUS_UPDATED, data });
    });

    /** API 8: Log đồng bộ thiết bị */
    static createDeviceSyncLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await DataIntegrationService.createDeviceSyncLog(patientId, req.body, userId);
            res.status(201).json({ success: true, message: DI_SUCCESS.DEVICE_SYNC_CREATED, data });
    });

    /** API 9: Lịch sử sync */
    static getDeviceSyncLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await DataIntegrationService.getDeviceSyncLogs(patientId);
            res.status(200).json({ success: true, message: DI_SUCCESS.DEVICE_SYNC_FETCHED, data });
    });

    /** API 10: Dashboard */
    static getIntegrationSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const patientId = req.params.patientId as string;
            const data = await DataIntegrationService.getIntegrationSummary(patientId);
            res.status(200).json({ success: true, message: DI_SUCCESS.SUMMARY_FETCHED, data });
    });
}
