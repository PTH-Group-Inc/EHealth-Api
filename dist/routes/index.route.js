"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRoutes = void 0;
const testProduct_route_1 = __importDefault(require("./testProduct.route"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const initRoutes = (app) => {
    //test product routes
    app.use('/api/test', testProduct_route_1.default);
    //auth routes
    app.use('/api/auth', auth_routes_1.default);
    //user management routes
    app.use('/api/users', user_routes_1.default);
};
exports.initRoutes = initRoutes;
