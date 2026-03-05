"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testProduct_controller_1 = require("../controllers/testProduct.controller");
const productRouter = (0, express_1.Router)();
productRouter.get('/testproducts', testProduct_controller_1.getAllProductsController);
exports.default = productRouter;
