import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.util';
import { getAllProductsService } from '../../services/Core/testProduct.service'

export const getAllProductsController = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const products = await getAllProductsService()
    return res.status(200).json({
        success: true,
        message: 'Get product list successfully',
        data: products
    })
})
