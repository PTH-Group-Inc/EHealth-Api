"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProductsRepo = void 0;
const postgresdb_1 = require("../config/postgresdb");
const getAllProductsRepo = async () => {
    const query = `
    SELECT id, name, description, price, stock, created_at
    FROM product
    ORDER BY created_at DESC
  `;
    const { rows } = await postgresdb_1.pool.query(query);
    return rows;
};
exports.getAllProductsRepo = getAllProductsRepo;
