import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { StockOutService } from '../../services/Medication Management/stock-out.service';
import { STOCK_OUT_SUCCESS, STOCK_OUT_CONFIG } from '../../constants/stock-out.constant';


const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class StockOutController {

    /** POST /api/stock-out */
    static createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth.user_id;
            const { warehouse_id, reason_type, supplier_id, dest_warehouse_id, notes } = req.body;
            const result = await StockOutService.createOrder(warehouse_id, reason_type, userId, supplier_id, dest_warehouse_id, notes);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_OUT_SUCCESS.ORDER_CREATED, data: result });
    });

    /** POST /api/stock-out/:orderId/items */
    static addItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await StockOutService.addItem(req.params.orderId as string, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: STOCK_OUT_SUCCESS.ITEM_ADDED, data: result });
    });

    /** DELETE /api/stock-out/:orderId/items/:detailId */
    static deleteItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            await StockOutService.deleteItem(req.params.orderId as string, req.params.detailId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.ITEM_DELETED });
    });

    /** PATCH /api/stock-out/:orderId/confirm */
    static confirm = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const userId = (req as any).auth.user_id;
            const result = await StockOutService.confirm(req.params.orderId as string, userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.CONFIRMED, data: result });
    });

    /** PATCH /api/stock-out/:orderId/cancel */
    static cancel = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await StockOutService.cancel(req.params.orderId as string, req.body.cancelled_reason);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.CANCELLED, data: result });
    });

    /** GET /api/stock-out */
    static getHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const page = parseInt(req.query.page as string) || STOCK_OUT_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || STOCK_OUT_CONFIG.DEFAULT_LIMIT;
            const status = req.query.status as string | undefined;
            const reasonType = req.query.reason_type as string | undefined;
            const warehouseId = req.query.warehouse_id as string | undefined;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await StockOutService.getHistory(page, limit, status, reasonType, warehouseId, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.LIST_FETCHED, data: result });
    });

    /** GET /api/stock-out/:orderId */
    static getDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await StockOutService.getDetail(req.params.orderId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: STOCK_OUT_SUCCESS.DETAIL_FETCHED, data: result });
    });
}
