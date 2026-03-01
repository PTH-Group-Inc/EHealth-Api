import swaggerJsdoc from 'swagger-jsdoc';

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
        url: 'http://localhost:3000' || process.env.API_URL,
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
                access_token: {
                  type: 'string',
                },
                refresh_token: {
                  type: 'string',
                },
                account_id: {
                  type: 'string',
                },
                role: {
                  type: 'string',
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
        // Patient Models
        Patient: {
          type: 'object',
          properties: {
            patient_id: {
              type: 'string',
            },
            patient_code: {
              type: 'string',
            },
            full_name: {
              type: 'string',
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'],
            },
            identity_type: {
              type: 'string',
              enum: ['CCCD', 'PASSPORT', 'OTHER'],
            },
            identity_number: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'DECEASED'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreatePatientRequest: {
          type: 'object',
          required: ['full_name', 'date_of_birth', 'contact'],
          properties: {
            full_name: {
              type: 'string',
              example: 'Nguyễn Văn A',
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '1990-01-15',
            },
            gender: {
              type: 'string',
              enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'],
            },
            identity_type: {
              type: 'string',
              enum: ['CCCD', 'PASSPORT', 'OTHER'],
            },
            identity_number: {
              type: 'string',
            },
            nationality: {
              type: 'string',
              example: 'VN',
            },
            contact: {
              type: 'object',
              required: ['phone_number'],
              properties: {
                phone_number: {
                  type: 'string',
                  example: '0987654321',
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
                street_address: {
                  type: 'string',
                },
                ward: {
                  type: 'string',
                },
                province: {
                  type: 'string',
                },
              },
            },
          },
        },
        PatientContact: {
          type: 'object',
          properties: {
            contact_id: {
              type: 'string',
            },
            patient_id: {
              type: 'string',
            },
            phone_number: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            street_address: {
              type: 'string',
            },
            ward: {
              type: 'string',
            },
            province: {
              type: 'string',
            },
            is_primary: {
              type: 'boolean',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PatientRelation: {
          type: 'object',
          properties: {
            relation_id: {
              type: 'string',
            },
            patient_id: {
              type: 'string',
            },
            full_name: {
              type: 'string',
            },
            relationship: {
              type: 'string',
              enum: ['PARENT', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER'],
            },
            phone_number: {
              type: 'string',
            },
            is_emergency: {
              type: 'boolean',
            },
            has_legal_rights: {
              type: 'boolean',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
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

export const swaggerSpec = swaggerJsdoc(options);
