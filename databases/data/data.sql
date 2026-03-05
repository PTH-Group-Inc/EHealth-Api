
-- 1. KHỞI TẠO DANH VAI TRÒ (ROLES)
INSERT INTO roles (roles_id, code, name, description, is_system) VALUES
('ROLE_ADMIN', 'ADMIN', 'Quản trị viên Hệ thống', 'Quản trị toàn quyền hệ thống', TRUE),
('ROLE_DOCTOR', 'DOCTOR', 'Bác sĩ chuyên khoa', 'Bác sĩ thực hiện khám và điều trị', TRUE),
('ROLE_NURSE', 'NURSE', 'Điều dưỡng', 'Hỗ trợ bác sĩ và chăm sóc sức khỏe', TRUE),
('ROLE_PATIENT', 'PATIENT', 'Bệnh nhân', 'Bệnh nhân khám trực tiếp tại phòng khám', TRUE),
('ROLE_CUSTOMER', 'CUSTOMER', 'Khách hàng', 'Người dùng hệ thống đặt lịch khám (có thể chưa làm hồ sơ)', TRUE);

-- 2. KHỞI TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
-- Mật khẩu mặc định là: Admin@123
INSERT INTO users (users_id, email, password_hash, status) VALUES 
('USR_ADMIN_01', 'admin@ehealth.com', '$2b$10$R0GcZwTCHCXpOJrjivZG0ec78wUYii4vRfVsMCz7415iQjZUb/DP.', 'ACTIVE');

-- 3. KHỞI TẠO HỒ SƠ ADMIN
INSERT INTO user_profiles (user_profiles_id, user_id, full_name) VALUES 
('UPRF_ADMIN_01', 'USR_ADMIN_01', 'System Administrator');

-- 4. PHÂN QUYỀN ADMIN (Gán QUYỀN ADMIN)
INSERT INTO user_roles (user_id, role_id) VALUES 
('USR_ADMIN_01', 'ROLE_ADMIN');
