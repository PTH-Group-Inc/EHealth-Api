import { getAllProductsRepo } from '../repository/testProduct.repository'
import { Product } from '../models/testProduct.models'

export const getAllProductsService = async (): Promise<Product[]> => {
  const products = await getAllProductsRepo()


  return products
}
