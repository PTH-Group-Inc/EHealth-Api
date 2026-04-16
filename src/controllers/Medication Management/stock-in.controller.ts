import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { StockInService } from '../../services/Medication Management/stock-in.service';
import { STOCK_IN_SUCCESS, STOCK_IN_CONFIG } from '../../constants/stock-in.constant';


const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class StockInController {

    /** POST /api/stock-in — Tạo phiếu nhập */
    static createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth.user_id;
            const { supplier_id, warehouse_id, notes } = req.body;
            const result = await StockInService.createOrder(supplier_id, warehouse_id, userId, notes);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_IN_SUCCESS.ORDER_CREATED, data: result });
    });

    /** POST /api/stock-in/:orderId/items — Thêm dòng thuốc */
    static addItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const orderId = req.params.orderId as string;
            const result = await StockInService.addItem(orderId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_IN_SUCCESS.ITEM_ADDED, data: result });
    });

    /** PATCH /api/stock-in/:orderId/confirm — Xác nhận */
    static confirm = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await StockInService.confirm(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.CONFIRMED, data: result });
    });

    /** PATCH /api/stock-in/:orderId/receive — Nhận hàng */
    static receive = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth.user_id;
            const result = await StockInService.receive(req.params.orderId as string, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.RECEIVED, data: result });
    });

    /** PATCH /api/stock-in/:orderId/cancel — Hủy phiếu */
    static cancel = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await StockInService.cancel(req.params.orderId as string, req.body.cancelled_reason);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.CANCELLED, data: result });
    });

    /** GET /api/stock-in — Lịch sử */
    static getHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || STOCK_IN_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || STOCK_IN_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const supplierId = req.query.supplier_id as string | undefined;
            const warehouseId = req.query.warehouse_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await StockInService.getHistory(page, limit, status, supplierId, warehouseId, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.LIST_FETCHED, data: result });
    });

    /** GET /api/stock-in/:orderId — Chi tiết */
    static getDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await StockInService.getDetail(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_IN_SUCCESS.DETAIL_FETCHED, data: result });
    });
}
