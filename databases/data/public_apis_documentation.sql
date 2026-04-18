-- ============================================================
-- PUBLIC APIs DOCUMENTATION
-- Đây là danh sách các API KHÔNG cần verifyAccessToken
-- hoặc authorizePermissions middleware.
-- Các endpoint này mở công khai cho bất kỳ ai truy cập.
-- ============================================================
-- Lý do: Bệnh nhân/khách vãng lai cần xem dữ liệu này
--        TRƯỚC KHI đăng nhập để lựa chọn đặt lịch, tra cứu
--        thông tin cơ sở y tế, dịch vụ, lịch hoạt động...
--
-- Cách xử lý trong route file:
--   router.get('/facilities', FacilityController.getAll);
--   (KHÔNG thêm verifyAccessToken hay authorizePermissions)
-- ============================================================

-- ----------------------------
-- 1. FACILITY (Cơ sở Y tế)
-- ----------------------------
-- GET /api/facilities          → Danh sách cơ sở y tế
-- GET /api/facilities/:id      → Chi tiết cơ sở y tế

-- ----------------------------
-- 2. SPECIALTY (Chuyên khoa)
-- ----------------------------
-- GET /api/specialties         → Danh sách chuyên khoa

-- ----------------------------
-- 3. MEDICAL SERVICES (Dịch vụ y tế)
-- ----------------------------
-- GET /api/medical-services    → Danh sách dịch vụ y tế

-- ----------------------------
-- 4. MASTER DATA (Danh mục nền)
-- ----------------------------
-- GET /api/master-data         → Danh mục nền (tỉnh/thành, nhóm máu, dân tộc...)

-- ----------------------------
-- 5. OPERATING HOURS (Giờ hoạt động)
-- ----------------------------
-- GET /api/operating-hours     → Danh sách giờ hoạt động cơ sở
-- GET /api/operating-hours/:id → Chi tiết giờ hoạt động

-- ----------------------------
-- 6. HOLIDAYS (Ngày lễ)
-- ----------------------------
-- GET /api/holidays            → Danh sách ngày lễ
-- GET /api/holidays/:id        → Chi tiết ngày lễ

-- ----------------------------
-- 7. CLOSED DAYS (Ngày nghỉ cố định)
-- ----------------------------
-- GET /api/closed-days         → Danh sách ngày đóng cửa

-- ----------------------------
-- 8. AVAILABLE SLOTS (Slot trống)
-- ----------------------------
-- GET /api/appointments/available-slots → Lấy slot khám còn trống theo ngày

-- ----------------------------
-- 9. DOCTOR AVAILABILITY (Lịch bác sĩ khả dụng)
-- ----------------------------
-- GET /api/doctor-availability/by-specialty/:specialtyId → DS bác sĩ theo chuyên khoa + ngày
-- GET /api/doctor-availability/by-date/:date             → Tổng quan BS làm việc trong ngày

-- ----------------------------
-- 10. SPECIALTY SERVICES (Dịch vụ theo chuyên khoa)
-- ----------------------------
-- GET /api/specialty-services/:specialtyId/services      → Dịch vụ của chuyên khoa

-- ----------------------------
-- 11. BOOKING CONFIG (Cấu hình đặt lịch)
-- ----------------------------
-- GET /api/booking-configs/branch/:branchId              → Cấu hình đặt khám chi nhánh

-- ----------------------------
-- 12. BILLING PRICING CATALOG (Bảng giá công khai)
-- ----------------------------
-- GET /api/billing/pricing/catalog                       → Danh mục dịch vụ tổng hợp
-- GET /api/billing/pricing/catalog/:facilityId           → Bảng giá tại cơ sở

-- ----------------------------
-- 13. ACTIVE PROMOTIONS (Ưu đãi đang chạy)
-- ----------------------------
-- GET /api/billing/pricing-policies/active-promotions    → Danh sách ưu đãi đang chạy

-- ----------------------------
-- 14. TELECONSULTATION TYPES (Loại hình khám từ xa)
-- ----------------------------
-- GET /api/teleconsultation/types/active                 → Hình thức khám từ xa đang hoạt động

-- ============================================================
-- AUTH ENDPOINTS (không nằm trong api_permissions)
-- ============================================================
-- POST /api/auth/login
-- POST /api/auth/register
-- POST /api/auth/refresh-token
-- POST /api/auth/forgot-password
-- POST /api/auth/reset-password
-- GET  /api/health              ← Health check
-- POST /api/billing/payments/webhook/sepay  ← Webhook thanh toán (xác thực riêng)
-- ============================================================
