import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { WarehouseService } from '../../services/Medication Management/warehouse.service';
import { WAREHOUSE_SUCCESS } from '../../constants/warehouse.constant';


const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class WarehouseController {

    /** GET /api/warehouses */
    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const branchId = req.query.branch_id as string | undefined;
            const search = req.query.search as string | undefined;
            const result = await WarehouseService.getAll(branchId, search);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.LIST_FETCHED,
                data: result,
            });
    });

    /** GET /api/warehouses/:id */
    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const result = await WarehouseService.getById(id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.DETAIL_FETCHED,
                data: result,
            });
    });

    /** POST /api/warehouses */
    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await WarehouseService.create(req.body);

            res.status(HTTP_STATUS.CREATED).json({
                success: true,
                message: WAREHOUSE_SUCCESS.CREATED,
                data: result,
            });
    });

    /** PATCH /api/warehouses/:id */
    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const result = await WarehouseService.update(id, req.body);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.UPDATED,
                data: result,
            });
    });

    /** PATCH /api/warehouses/:id/toggle */
    static toggle = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.id as string;
            const result = await WarehouseService.toggle(id);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: WAREHOUSE_SUCCESS.TOGGLED,
                data: result,
            });
    });
}
