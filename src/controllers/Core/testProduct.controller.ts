import { Request, Response } from 'express'
import { getAllProductsService } from '../../services/Core/testProduct.service'
import logger from '../../config/logger.config';


export const getAllProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const products = await getAllProductsService()

    return res.status(200).json({
      success: true,
      message: 'Get product list successfully',
      data: products
    })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}
