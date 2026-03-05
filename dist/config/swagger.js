"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-Health Server API',
            description: 'Hệ thống quản lý phòng khám',
            version: '1.0.0',
            contact: {
                name: 'PTH Group Inc',
                email: 'contact@pthgroup.com',
            },
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT access token',
                },
            },
            schemas: {
                // Auth Models
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com',
                        },
                        password: {
                            type: 'string',
                            example: 'password123',
                        },
                        clientInfo: {
                            type: 'object',
                            description: 'Thông tin thiết bị - Tùy chọn. Nếu không gửi vẫn có thể login bình thường',
                            properties: {
                                deviceId: {
                                    type: 'string',
                                    description: 'ID thiết bị (UUID hoặc unique identifier)',
                                    example: '550e8400-e29b-41d4-a716-446655440000',
                                },
                                deviceName: {
                                    type: 'string',
                                    description: 'Tên thiết bị (iPhone 13, Samsung Galaxy, etc)',
                                    example: 'iPhone 13 Pro',
                                },
                                userAgent: {
                                    type: 'string',
                                    description: 'User agent từ browser',
                                    example: 'Mozilla/5.0...',
                                },
                            },
                        },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                        },
                        data: {
                            type: 'object',
                            properties: {
                                accessToken: {
                                    type: 'string',
                                },
                                refreshToken: {
                                    type: 'string',
                                },
                                expiresIn: {
                                    type: 'number',
                                },
                                user: {
                                    type: 'object',
                                    properties: {
                                        userId: {
                                            type: 'string',
                                        },
                                        name: {
                                            type: 'string',
                                        },
                                        avatar: {
                                            type: 'string',
                                            nullable: true,
                                        },
                                        email: {
                                            type: 'string',
                                            nullable: true,
                                        },
                                        phone: {
                                            type: 'string',
                                            nullable: true,
                                        },
                                        roles: {
                                            type: 'array',
                                            items: {
                                                type: 'string',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'password', 'name'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        password: {
                            type: 'string',
                            minLength: 8,
                        },
                        name: {
                            type: 'string',
                        },
                    },
                },
                SessionInfo: {
                    type: 'object',
                    properties: {
                        sessionId: {
                            type: 'string',
                        },
                        device: {
                            type: 'string',
                        },
                        ip: {
                            type: 'string',
                        },
                        lastActiveAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        current: {
                            type: 'boolean',
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                        },
                        code: {
                            type: 'string',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        './src/routes/*.ts',
    ],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
