"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProductsService = void 0;
const testProduct_repository_1 = require("../repository/testProduct.repository");
const getAllProductsService = async () => {
    const products = await (0, testProduct_repository_1.getAllProductsRepo)();
    return products;
};
exports.getAllProductsService = getAllProductsService;
