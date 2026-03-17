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
      // ===== MODULE 1: HỆ THỐNG LÕI =====
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
      { name: '1.6 Quản lý hồ sơ người dùng (User Profile)', description: 'Xem và cập nhật thông tin cá nhân của người dùng đang đăng nhập' },
      { name: '1.7.1 Quản lý Loại Thông báo (Notification Categories)', description: 'Thiết lập các cấu hình nhóm thông báo cốt lõi của hệ thống' },
      { name: '1.7.2 Quản lý Mẫu Thông báo (Notification Templates)', description: 'Thiết lập và tùy chỉnh các mẫu thông báo đa kênh' },
      { name: '1.7.3 Cấu hình Thông báo theo Vai trò', description: 'Thiết lập cấu trúc Role nào nhận thông báo qua kênh nào' },
      { name: '1.7.4 Broadcast & Lõi Thông báo (Engine)', description: 'Trigger sự kiện và bắn thông báo thủ công hàng loạt' },
      { name: '1.7.5 Hộp thư Thông báo cá nhân (User Inbox)', description: 'Xem danh sách và đánh dấu đọc In-app Notifications' },
      { name: '1.8 Quản lý Nhật ký hệ thống (Audit Logs)', description: 'Tracking API Mọi thao tác POST/PUT/DELETE' },

      // ===== MODULE 2: QUẢN LÝ CƠ SỞ Y TẾ =====
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
      { name: '2.9.1 Gán dịch vụ - Chuyên khoa', description: 'Quản lý liên kết N-N giữa Dịch vụ y tế chuẩn và Chuyên khoa' },
      { name: '2.9.2 Gán dịch vụ - Bác sĩ', description: 'Quản lý liên kết N-N giữa Bác sĩ và Dịch vụ cơ sở' },
      { name: '2.9.3 Quản lý danh mục dịch vụ chuẩn', description: 'Các API liên quan đến quản lý danh mục gốc các dịch vụ y tế' },
      { name: '2.9.4 Quản lý dịch vụ cơ sở', description: 'Cấu hình giá và quy định đối với dịch vụ chuẩn áp dụng riêng tại từng cơ sở' },
      { name: '2.10 Quản lý Trang thiết bị Y tế', description: 'API Quản lý thiết bị y tế, gán phòng, bảo trì' },
      { name: '2.11 Quản lý Giường bệnh', description: 'API Quản lý giường bệnh, gán phòng, đổi trạng thái' },
      { name: '2.12 Cấu hình Quy tắc đặt khám', description: 'API Cấu hình quy tắc đặt lịch khám theo cơ sở/chi nhánh' },

      // ===== MODULE 3: QUẢN LÝ BỆNH NHÂN =====
      { name: '2.1 Quản lý Hồ sơ Bệnh nhân', description: 'API CRUD hồ sơ bệnh nhân, liên kết tài khoản App, đổi trạng thái' },
      { name: '2.2 Lịch sử Khám & Điều trị', description: 'API Xem danh sách lượt khám, chi tiết, dòng thời gian, tổng hợp (Read-Only)' },
      { name: '2.3.1 Quản lý Đơn vị Bảo hiểm', description: 'API CRUD đơn vị bảo hiểm (insurance_providers)' },
      { name: '2.3.2 Quản lý Thẻ Bảo hiểm Bệnh nhân', description: 'API CRUD thẻ bảo hiểm bệnh nhân (patient_insurances)' },
      { name: '2.3.3 Hiệu lực Bảo hiểm', description: 'API Kiểm tra thẻ BH còn hiệu lực / đã hết hạn' },
      { name: '2.3.4 Tỷ lệ Chi trả Bảo hiểm', description: 'API CRUD cấu hình tỷ lệ chi trả bảo hiểm (insurance_coverages)' },
      { name: '2.3.5 Liên kết Bảo hiểm - Bệnh nhân', description: 'API Nested routes: xem & thêm thẻ BH cho bệnh nhân cụ thể' },
      { name: '2.3.6 Lịch sử thay đổi Bảo hiểm', description: 'API Tra cứu audit_logs thay đổi thẻ bảo hiểm' },
      { name: '2.3.7 Trạng thái Bảo hiểm Bệnh nhân', description: 'API Cập nhật cờ has_insurance, lọc BN có/không BH cho Billing' },
      { name: '2.4.1 Quản lý Người thân Bệnh nhân', description: 'API CRUD người thân/người giám hộ của bệnh nhân (patient_contacts)' },
      { name: '2.4.2 Quản lý Loại quan hệ', description: 'API CRUD danh mục loại quan hệ (relation_types): Cha, Mẹ, Vợ/Chồng, Con...' },
      { name: '2.4.3 Quản lý liên hệ khẩn cấp', description: 'API Đặt/hủy liên hệ khẩn cấp, danh sách liên hệ khẩn cấp của bệnh nhân' },
      { name: '2.4.4 Chỉ định người đại diện pháp lý', description: 'API Chỉ định/hủy người đại diện pháp lý (duy nhất), xem đại diện hiện tại' },
      { name: '2.4.5 Ghi chú quyền quyết định y tế', description: 'API Cập nhật và xem ghi chú quyền quyết định y tế của người thân' },
      { name: '2.4.6 Phân biệt người thân - liên hệ khẩn cấp', description: 'API Filter: tất cả liên hệ, người thân thông thường, người giám hộ' },
      { name: '2.5.1 Upload tài liệu bệnh nhân', description: 'API Upload, danh sách, chi tiết, cập nhật metadata và xóa tài liệu bệnh nhân (Cloudinary)' },
      { name: '2.5.2 Phân loại tài liệu', description: 'API CRUD danh mục loại tài liệu (document_types): CMND, BHYT, X-Quang...' },
      { name: '2.5.3 Gắn tài liệu vào hồ sơ bệnh nhân', description: 'API tường minh lồng trong /api/patients/:patientId/documents' },
      { name: '2.5.4 Phiên bản tài liệu', description: 'API quản lý lịch sử phiên bản file tài liệu y tế' },
      { name: '2.5.5 Xem & Tải tài liệu', description: 'API Proxy bảo mật để xem inline và ép tải file từ Cloudinary' },
      { name: '2.6.1 Danh mục thẻ bệnh nhân', description: 'API CRUD danh mục thẻ phân loại bệnh nhân (Tags): VIP, Mãn tính, Nguy cơ cao...' },
      { name: '2.6.2 Gắn thẻ bệnh nhân', description: 'API Gắn/Gỡ thẻ trên hồ sơ bệnh nhân (n-n mapping)' },
      { name: '2.6.4 Lọc bệnh nhân theo thẻ', description: 'API lọc danh sách bệnh nhân theo tag (AND/OR logic)' },
      { name: '2.6.5 Luật phân loại tự động', description: 'API CRUD cấu hình Rule gắn thẻ tự động (VD: khám > 10 lần → VIP)' },
      { name: '2.7 Tìm kiếm & Tra cứu', description: 'API Tìm kiếm nâng cao, autocomplete nhanh, tra cứu tóm tắt hồ sơ bệnh nhân' },
      { name: '2.9 Theo dõi & Audit Hồ sơ Bệnh nhân', description: 'API Tra cứu lịch sử thay đổi hồ sơ bệnh nhân (audit trail)' },

      // ===== MODULE 3: LỊCH KHÁM =====
      { name: '3.1 Quản lý Lịch khám', description: 'API Quản lý Lịch khám' },
      { name: '3.2 Quản lý khung giờ & ca khám', description: 'API Quản lý khung giờ & ca khám' },
      { name: '3.3 Quản lý lịch bác sĩ', description: 'API Quản lý Lịch bác sĩ' },
      { name: '3.4 Quản lý phòng khám & tài nguyên', description: 'API Quản lý Lịch khám' },
      { name: '3.6 Xác nhận & Nhắc lịch', description: 'API Xác nhận, nhắc lịch, check-in, hoàn tất lịch khám' },
      { name: '3.7 Check-in & Trạng thái', description: 'API Check-in, hoàn tất, hủy, đánh dấu no-show lịch khám' },
      { name: '3.8 Quản lý thay đổi & dời lịch', description: 'API Dời lịch, hủy lịch, lịch sử thay đổi, chính sách hủy' },
      { name: '3.9 Điều phối & tối ưu lịch khám', description: 'API Phân bổ tải, gợi ý slot, cân bằng, ưu tiên, reassign, auto-assign, AI dataset' },

      // ===== MODULE 4: KHÁM BỆNH & HỒ SƠ BỆNH ÁN (EMR) =====
      { name: '4.1 Encounter Management', description: 'API Tiếp nhận & Mở hồ sơ khám bệnh (Encounter), gán BS/phòng, chuyển trạng thái, walk-in/cấp cứu' },
      { name: '4.2 Clinical Examination', description: 'API Ghi nhận khám lâm sàng, sinh hiệu, tiền sử, chẩn đoán, kế hoạch điều trị' },
      { name: '4.3 Diagnosis Management', description: 'API Quản lý chẩn đoán, tìm kiếm mã ICD-10, lịch sử chẩn đoán theo bệnh nhân' },
      { name: '4.4 Medical Orders', description: 'API Quản lý chỉ định, tìm kiếm dịch vụ CLS, lịch sử chỉ định theo bệnh nhân, dashboard chỉ định chờ thực hiện, tóm tắt chỉ định + kết quả' },
      { name: '4.5 Prescription Management', description: 'API Kê đơn thuốc, quản lý dòng thuốc chi tiết, liên kết chẩn đoán, trạng thái đơn (DRAFT → PRESCRIBED), tìm kiếm thuốc, lịch sử đơn theo bệnh nhân' },
      { name: '4.6 Medical Records', description: 'API Hồ sơ bệnh án điện tử: tổng hợp encounter, completeness, finalize & khóa, ký số, snapshot, timeline, thống kê, xuất/in, tìm kiếm nâng cao' },
      { name: '4.7 Treatment Progress', description: 'API Quản lý tiến trình điều trị' },
      { name: '4.8 Medical Sign-off', description: 'API Ký số & xác nhận hồ sơ y khoa: xác nhận hoàn tất khám, ký nháp/chính thức, thu hồi, xác minh toàn vẹn, khóa chỉnh sửa, audit log' },

      // ===== MODULE 5: QUẢN LÝ THUỐC =====
      { name: '5.1 Quản lý danh mục thuốc', description: 'API Quản lý danh mục thuốc' },
      { name: '5.5 Dispensing Management', description: 'API Cấp phát thuốc & xuất kho: tạo phiếu, trừ kho, kiểm tra tồn kho, hủy + hoàn kho' },
      { name: '5.6 Drug Inventory Tracking', description: 'API Theo dõi tồn kho: danh sách, cảnh báo hết hạn, cảnh báo tồn kho thấp, nhập kho, cập nhật' },
      { name: '5.7 Warehouse Management', description: 'API Quản lý kho thuốc: CRUD kho theo chi nhánh' },
      { name: '5.8 Stock-In Management', description: 'API Nhập kho & NCC: CRUD NCC, phiếu nhập kho (DRAFT→CONFIRMED→RECEIVED→CANCELLED)' },
      { name: '5.9 Stock-Out Management', description: 'API Xuất kho & Hủy hàng: hủy thuốc, trả NCC, chuyển kho, hao hụt' },
      { name: '5.10 Medication Instructions', description: 'API Hướng dẫn sử dụng thuốc: mẫu chuẩn hóa (DOSAGE/FREQUENCY/ROUTE/INSTRUCTION) + hướng dẫn mặc định theo thuốc' },




    ]
  },
  apis: [
    './src/routes/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
