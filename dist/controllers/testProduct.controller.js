"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProductsController = void 0;
const testProduct_service_1 = require("../services/testProduct.service");
const getAllProductsController = async (req, res) => {
    try {
        const products = await (0, testProduct_service_1.getAllProductsService)();
        return res.status(200).json({
            success: true,
            message: 'Get product list successfully',
            data: products
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllProductsController = getAllProductsController;
