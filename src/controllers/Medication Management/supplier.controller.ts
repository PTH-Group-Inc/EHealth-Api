import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.util';
import { SupplierService } from '../../services/Medication Management/supplier.service';
import { SUPPLIER_SUCCESS } from '../../constants/stock-in.constant';


const HTTP_STATUS = { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 };


export class SupplierController {

    static getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const search = req.query.search as string | undefined;
            const activeOnly = req.query.active_only === 'true';
            const result = await SupplierService.getAll(search, activeOnly);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SUPPLIER_SUCCESS.LIST_FETCHED, data: result });
    });

    static getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await SupplierService.getById(req.params.id as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SUPPLIER_SUCCESS.DETAIL_FETCHED, data: result });
    });

    static create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await SupplierService.create(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: SUPPLIER_SUCCESS.CREATED, data: result });
    });

    static update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
            const result = await SupplierService.update(req.params.id as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: SUPPLIER_SUCCESS.UPDATED, data: result });
    });
}
