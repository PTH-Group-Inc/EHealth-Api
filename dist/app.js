"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const index_route_1 = require("./routes/index.route");
const SessionCleanup_jobs_1 = require("./jobs/SessionCleanup.jobs");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #4a90e2; }',
    customSiteTitle: 'E-Health API Documentation',
}));
(0, index_route_1.initRoutes)(app);
SessionCleanup_jobs_1.SessionCleanup.startSessionCleanupJob();
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Endpoint API không tồn tại trên hệ thống.'
    });
});
app.use((err, req, res, next) => {
    console.error('[Global Error]:', err);
    res.status(err.status || 500).json({
        success: false,
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Lỗi máy chủ nội bộ'
    });
});
exports.default = app;
