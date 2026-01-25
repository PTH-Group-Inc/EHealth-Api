import pool from '../config/postgresdb'
import { Product } from '../models/testProduct.models'

export const getAllProductsRepo = async (): Promise<Product[]> => {
  const query = `
    SELECT id, name, description, stock, created_at
    FROM product
    ORDER BY created_at DESC
  `

  const { rows } = await pool.query(query)
  return rows
}
