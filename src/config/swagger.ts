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
    tags: [
      { name: '1.1.1 Quản lý User', description: 'Các chức năng CRUD cơ bản' },
      { name: '1.1.2 Khóa / mở khóa tài khoản', description: 'Action locking' },
      { name: '1.1.3 Quản lý trạng thái tài khoản', description: 'Vòng đời tài khoản' },
      { name: '1.1.4 Reset mật khẩu người dùng', description: 'Bảo mật mật khẩu' },
      { name: '1.1.5 Gán vai trò cho người dùng', description: 'Map N-N Role cho User' },
      { name: '1.1.6 Gán người dùng vào cơ sở y tế', description: 'Map N-N Facility cho User' },
      { name: '1.1.7 Import người dùng hàng loạt', description: 'Upload file Excel/CSV' },
      { name: '1.1.8 Export danh sách người dùng', description: 'Tải xuống xuất Excel' },
      { name: '1.1.9 API phục vụ filter / dropdown', description: 'List nhanh Facility/Roles' },
      { name: '1.2.1 Xác thực & Đăng nhập hệ thống', description: 'Login, Register, OTP' },
      { name: '1.2.2 Quản lý Phiên đăng nhập', description: 'Tracking thiết bị, Kick User' },
      { name: '1.3.1 Quản lý danh mục vai trò', description: 'Cấu hình System Roles' },
      { name: '1.3.2 Quản lý danh sách quyền', description: 'Cấu hình Core Permission Codes' },
      { name: '1.3.3 Gán quyền cho vai trò', description: 'Kế thừa Permission cho Role' },
      { name: '1.3.4 Phân quyền theo module', description: 'Tra cứu Modules' },
      { name: '1.3.5 Kiểm soát hiển thị menu theo vai trò', description: 'Định nghĩa UI Menus & Gán Role' },
      { name: '1.3.6 Kiểm soát API theo vai trò', description: 'Định nghĩa Endpoints & Gán Role' },
      { name: '1.3.7 Kiểm tra quyền của user', description: 'Lấy dữ liệu Context qua JWT cho Client' },
      { name: '1.4.1 Cấu hình thông tin cơ sở y tế', description: 'Xem và cập nhật thông tin cơ sở y tế, upload logo' },
      { name: '1.4.2 Cấu hình thời gian làm việc', description: 'Giờ mở/đóng cửa 7 ngày và cấu hình slot khám' },
      { name: '1.4.3 Cấu hình quy định nghiệp vụ', description: 'Tham số nghiệp vụ: hủy lịch, đặt lịch, bảo mật...' },
      { name: '1.4.4 Cấu hình bảo mật', description: 'Tham số bảo mật: password, token, session, 2FA' },
      { name: '1.4.5 Cấu hình đa ngôn ngữ', description: 'Ngôn ngữ mặc định, danh sách ngôn ngữ hỗ trợ' },
      { name: '1.4.6 Cấu hình giao diện', description: 'Theme, màu sắc, font, date/time format, timezone' },
      { name: '1.4.7 Quản lý tham số hệ thống', description: 'CRUD system_settings theo module, có protected key' },
      { name: '1.4.8 Phân quyền chỉnh sửa cấu hình', description: 'Kiểm soát vai trò nào được phép chỉnh sửa các module tham số hệ thống' },
      { name: '1.5.1 Quản lý danh mục chuyên khoa', description: 'CRUD chuyên khoa, hỗ trợ phân trang và tìm kiếm' },
      { name: '1.5.2 Quản lý danh mục', description: 'CRUD bệnh viện, hỗ trợ phân trang và tìm kiếm' },
      { name: '1.5.3 Quản lý danh mục thuốc', description: 'Quản lý Nhóm thuốc (Drug Categories) và Từ điển thuốc (Drugs)' },
      { name: '1.5.4 Quản lý danh mục dịch vụ chuẩn', description: 'Các API liên quan đến quản lý danh mục gốc các dịch vụ y tế' },
      { name: '1.5.5 Quản lý dịch vụ cơ sở', description: 'Cấu hình giá và quy định đối với dịch vụ chuẩn áp dụng riêng tại từng cơ sở' },
      { name: '1.6 Quản lý hồ sơ người dùng (User Profile)', description: 'Xem và cập nhật thông tin cá nhân của người dùng đang đăng nhập' },
      { name: '1.7.1 Quản lý Loại Thông báo (Notification Categories)', description: 'Thiết lập các cấu hình nhóm thông báo cốt lõi của hệ thống' },
      { name: '1.7.2 Quản lý Mẫu Thông báo (Notification Templates)', description: 'Thiết lập và tùy chỉnh các mẫu thông báo đa kênh' },
      { name: '1.7.3 Cấu hình Thông báo theo Vai trò', description: 'Thiết lập cấu trúc Role nào nhận thông báo qua kênh nào' },
      { name: '1.7.4 Broadcast & Lõi Thông báo (Engine)', description: 'Trigger sự kiện và bắn thông báo thủ công hàng loạt' },
      { name: '1.7.5 Hộp thư Thông báo cá nhân (User Inbox)', description: 'Xem danh sách và đánh dấu đọc In-app Notifications' },
      { name: '1.8 Quản lý Nhật ký hệ thống (Audit Logs)', description: 'Tracking API Mọi thao tác POST/PUT/DELETE' },
      { name: '2.1 Quản lý Cơ sở Y tế', description: 'API Tạo và Cập nhật Cơ sở Y tế đa chi nhánh, upload logo' },
      { name: '2.2 Quản lý Chi nhánh', description: 'API Tạo và cấu hình Chi nhánh trực thuộc, phân tuyến cơ sở' },
      { name: '2.3 Quản lý Khoa/Phòng ban', description: 'API Quản lý chuyên khoa trực thuộc chi nhánh' },
      { name: '2.4 Quản lý Không gian/Phòng khám', description: 'API Quản lý không gian chức năng, buồng khám' },
      { name: '2.5 Quản lý Nhân sự y tế', description: 'API Quản lý Nhân sự y tế' },
      { name: '2.6.1 Quản lý Lịch làm việc & Ca trực', description: 'API Quản lý Ca làm việc' },
      { name: '2.6.2 Quản lý Lịch làm việc & Slot Khám', description: 'API Quản lý Slot Khám' },
      { name: '2.6.3 Quản lý Lịch Nhân viên', description: 'API Phân công xếp lịch khám bệnh' },
      { name: '2.6.4 Tạm ngưng lịch làm việc', description: 'API Tạm ngưng và mở lại lịch trực' },
      { name: '2.6.5 Quản lý Nghỉ phép', description: 'API Tạo, duyệt, từ chối đơn nghỉ phép' },
      { name: '2.6.6 Đổi ca làm việc', description: 'API Tạo yêu cầu đổi ca và duyệt/từ chối' },
      { name: '2.7 Giấy phép & Chứng chỉ', description: 'API Quản lý giấy phép, chứng chỉ hành nghề nhân viên y tế' },
      { name: '2.8 Giờ hoạt động cơ sở', description: 'API Quản lý giờ hoạt động cơ sở' },
    ]
  },
  apis: [
    './src/routes/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
