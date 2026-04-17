# E-Health Server (Hệ thống Quản lý Phòng Khám/Bệnh viện)

**Tác giả:** Phan Thanh Hải

👉 [English Version Below](#e-health-server-clinic--hospital-management-system-english)

Đây là dự án Backend (Server) của Hệ thống Quản lý Y tế Toàn diện (E-Health). Hệ thống được xây dựng với kiến trúc module hóa linh hoạt, phục vụ hàng loạt các bài toán quản lý phức tạp tại các cơ sở y tế (phòng khám, bệnh viện vừa và nhỏ).

---

## 🌟 Chức Năng Nổi Bật

Hệ thống Backend (BE) này đã được chia thành các phân hệ lõi, bao gồm:

1. **Quản lý Cốt lõi (Core Management):**
   - Phân quyền (RBAC), xác thực người dùng (JWT, Firebase Auth).
   - Quản lý chi nhánh (Branches) và mạng lưới cơ sở y tế.
   - Quản lý nhân sự, ca làm việc, lịch nghỉ (Doctor Absences, Leaves, Shift Swap).
   - Thông báo đa luồng (Notification Service).

2. **Quản lý Đặt khám & Lịch trình (Appointment Management):**
   - Đặt lịch trực tuyến tự động phân bổ theo khung giờ (Doctor Availability & Appointment Slots).
   - Xác nhận nhận bệnh (Check-in), Quản lý hàng đợi ưu tiên (Queue Management).
   - Dịch vụ thay đổi lịch & hủy lịch khám nhanh chóng.

3. **Quản lý Bệnh nhân (Patient Management):**
   - Hồ sơ bệnh nhân toàn diện (Patient Profiles), liên kết bảo hiểm y tế (Patient Insurance).
   - Cổng giao tiếp bệnh nhân (Patient Portal).

4. **Bệnh án điện tử (EMR/EHR):**
   - Cập nhật quá trình khám và điều trị điện tử.
   - Quản lý chẩn đoán (Diagnosis), kết quả cận lâm sàng (Clinical Results).
   - Quản lý kế hoạch điều trị và tiến trình (Treatment Plan & Progress).

5. **Giải pháp Tư vấn Từ xa (Remote Consultation / Telemedicine):**
   - Công cụ khám chữa bệnh từ xa, cấu hình chất lượng đường truyền.
   - Đấu nối lịch hẹn tư vấn Online.

6. **Dược phẩm & Kho tư vật tư Y tế (Medication & Facility Management):**
   - Quản lý kho, nhập/xuất kho tự động (Stock In/Out).
   - Quản lý danh mục thuốc (Drug Categories).
   - Quản lý cơ sở vật chất (Giường bệnh, Phòng y tế, Thiết bị... và bảo trì thiết bị).

7. **Kế toán & Viện phí (Billing & Finance):**
   - Xử lý hóa đơn viện phí đa nền tảng (Payment Gateways).
   - Chính sách giá, hoàn tiền (Refunds), đối soát tài chính (Reconciliation).

---

## 🛠 Công Nghệ Sử Dụng

- **Ngôn ngữ:** TypeScript & Node.js
- **Framework:** Express.js
- **CSDL (Database):** PostgreSQL với `pgvector` (Khả năng tương thích cho AI vector search)
- **ORM:** TypeORM
- **Authentication:** JWT (JSON Web Tokens) & Firebase Admin.
- **Tài liệu API:** Swagger UI Express
- **Lưu trữ tĩnh (Storage):** Cloudinary / Multer
- **Mail & Cron Jobs:** Nodemailer, node-cron
- **Tools:** Xử lý file CSV/Excel (`exceljs`, `csv-parse`), Unit Test `Jest`.

---

## ⚙️ Hướng Dẫn Cài Đặt và Chạy Dự Án

### Yêu cầu môi trường
- NodeJS (Khuyến nghị bản LTS như 18.x hoặc 20.x)
- PostgreSQL đang hoạt động.
- Trình quản lý package: `npm` hoặc `yarn`.

### Các bước triển khai

**1. Clone dự án và cài đặt dependencies**
```bash
git clone <đường-dẫn-chứa-repo>
cd E-Health_server
npm install
```

**2. Cấu hình môi trường**
Tạo file `.env` dựa theo file `.env.example` (nếu có) hoặc khai báo các thông tin cần thiết:
```env
PORT=...
DATABASE_URL=...
JWT_SECRET=...
CLOUDINARY_URL=...
```

**3. Khởi chạy CSDL**
Đảm bảo đã tạo Database thành công. TypeORM có hỗ trợ synchronize (để tự đồng bộ schema trong mô trường dev).
```bash
# Chạy migration nếu cần:
npm run typeorm migration:run
```

**4. Khởi chạy dự án (Môi trường Dev)**
Phiên bản DEV có hỗ trợ live-reload (xem thay đổi mã nguồn real-time).
```bash
npm run dev
```

**5. Build & Chạy Prod**
Biên dịch TypeScript sang JavaScript.
```bash
npm run build
npm run start:prod
```

**6. Tài liệu API (SwaggerDocs)**
Sau khi khởi chạy ứng dụng thành công, vui lòng truy cập đường dẫn sau trên trình duyệt để kiểm tra chi tiết các Endpoints:
```
http://localhost:3000/api-docs
```

### Chạy Testing
Mã nguồn có chuẩn hóa Unit Tests tích hợp:
```bash
npm run test
```

---

*Hệ thống được thiết kế với tính mở rộng cao, cấu hình thân thiện có thể dễ dàng apply cho đa quy mô phòng khám và bệnh viện.*

<br><br>
<hr>
<br><br>

# E-Health Server (Clinic / Hospital Management System) [English]

**Author:** Phan Thanh Hải

This is the Backend (Server) project of the Comprehensive Healthcare Management System (E-Health). The system is built with a flexible modular architecture, serving a wide range of complex management tasks in healthcare facilities (small to medium clinics and hospitals).

---

## 🌟 Key Features

This Backend (BE) system is divided into core modules, including:

1. **Core Management:**
   - Role-Based Access Control (RBAC), user authentication (JWT, Firebase Auth).
   - Branch network and healthcare facility management.
   - HR management, shifts, leave schedules (Doctor Absences, Leaves, Shift Swap).
   - Multi-channel Notification Service.

2. **Appointment & Schedule Management:**
   - Automated online booking based on time slots (Doctor Availability & Appointment Slots).
   - Patient Check-in, Priority Queue Management.
   - Quick appointment rescheduling & cancellation services.

3. **Patient Management:**
   - Comprehensive Patient Profiles, Health Insurance linkage.
   - Patient Portal for seamless patient-clinic communication.

4. **Electronic Medical/Health Records (EMR/EHR):**
   - Electronic updates of medical examination and treatment processes.
   - Management of Diagnosis and Clinical Results.
   - Treatment Plan & Progress tracking.

5. **Remote Consultation / Telemedicine:**
   - Telemedicine tools with transmission quality configuration.
   - Online consultation scheduling integration.

6. **Medication & Facility Management:**
   - Inventory management, automated Stock In/Out.
   - Drug Categories management.
   - Facility management (Beds, Medical Rooms, Equipment, and Maintenance).

7. **Billing & Finance:**
   - Multi-platform hospital fee invoicing (Payment Gateways).
   - Pricing policies, Refunds, and financial Reconciliation.

---

## 🛠 Technologies Used

- **Language:** TypeScript & Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL with `pgvector` (Compatibility for AI vector search)
- **ORM:** TypeORM
- **Authentication:** JWT (JSON Web Tokens) & Firebase Admin
- **API Documentation:** Swagger UI Express
- **Static Storage:** Cloudinary / Multer
- **Mail & Cron Jobs:** Nodemailer, node-cron
- **Tools:** CSV/Excel parsing (`exceljs`, `csv-parse`), Unit Testing (`Jest`)

---

## ⚙️ Installation and Setup Guide

### Prerequisites
- NodeJS (LTS version recommended, e.g., 18.x or 20.x)
- Running instance of PostgreSQL.
- Package manager: `npm` or `yarn`.

### Deployment Steps

**1. Clone the project and install dependencies**
```bash
git clone <repository-url>
cd E-Health_server
npm install
```

**2. Environment Configuration**
Create an `.env` file based on `.env.example` (if available) or declare necessary variables:
```env
PORT=...
DATABASE_URL=...
JWT_SECRET=...
CLOUDINARY_URL=...
```

**3. Initialize the Database**
Make sure the Database is successfully created. TypeORM supports synchronization (to auto-sync schema in the dev environment).
```bash
# Run migrations if necessary:
npm run typeorm migration:run
```

**4. Run the project (Dev Environment)**
The DEV version supports live-reload (real-time source code changes).
```bash
npm run dev
```

**5. Build & Run Prod**
Compile TypeScript to JavaScript.
```bash
npm run build
npm run start:prod
```

**6. API Documentation (SwaggerDocs)**
After successfully launching the application, please visit the following URL in your browser to check the details of the Endpoints:
```
http://localhost:3000/api-docs
```

### Running Tests
The source code has standardized integrated Unit Tests:
```bash
npm run test
```

---

*The system is designed with high scalability and a user-friendly configuration that can be easily applied to various scales of clinics and hospitals.*
