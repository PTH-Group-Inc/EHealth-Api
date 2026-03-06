
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
('USR_ADMIN_01', 'ROLE_ADMIN');

-- =========================================================================
-- MOCK DATA: QUẢN LÝ CƠ SỞ Y TẾ (FACILITY MANAGEMENT)
-- =========================================================================

-- 1. Thêm Cơ sở y tế (Facilities)
INSERT INTO facilities (facilities_id, code, name, tax_code, email, phone, headquarters_address) VALUES
('FAC_01', 'EHEALTH_VN', 'Hệ thống Y tế E-Health Việt Nam', '0101234567', 'contact@ehealth.vn', '19001515', '123 Nguyễn Văn Linh, Quận 7, TP.HCM');

-- 2. Thêm Chi nhánh (Branches)
INSERT INTO branches (branches_id, facility_id, code, name, address, phone, established_date) VALUES
('BR_HCM_01', 'FAC_01', 'HCM_Q7', 'Phòng khám Đa khoa E-Health Quận 7', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', '02873001111', '2020-01-01'),
('BR_HN_01', 'FAC_01', 'HN_CG', 'Phòng khám Đa khoa E-Health Cầu Giấy', '456 Cầu Giấy, Hà Nội', '02473002222', '2021-06-15');

-- 3. Thêm Phòng ban / Khoa (Departments)
INSERT INTO departments (departments_id, branch_id, code, name, description) VALUES
('DEPT_HCM_NOI', 'BR_HCM_01', 'KHOA_NOI_HCM', 'Khoa Nội Tổng Hợp', 'Khám các bệnh lý nội khoa'),
('DEPT_HCM_NHI', 'BR_HCM_01', 'KHOA_NHI_HCM', 'Khoa Nhi', 'Khám bệnh lý trẻ em'),
('DEPT_HCM_XN', 'BR_HCM_01', 'KHOA_XN_HCM', 'Khoa Xét Nghiệm', 'Thực hiện xét nghiệm huyết học, sinh hóa'),
('DEPT_HN_NOI', 'BR_HN_01', 'KHOA_NOI_HN', 'Khoa Nội Tổng Hợp', 'Khám các bệnh lý nội khoa');

-- 4. Thêm Phòng khám / Phòng chức năng (Medical Rooms)
INSERT INTO medical_rooms (medical_rooms_id, department_id, code, name, room_type, capacity) VALUES
('RM_HCM_N101', 'DEPT_HCM_NOI', 'P101', 'Phòng Khám Nội 1', 'CONSULTATION', 1),
('RM_HCM_N102', 'DEPT_HCM_NOI', 'P102', 'Phòng Khám Nội 2', 'CONSULTATION', 1),
('RM_HCM_NHI1', 'DEPT_HCM_NHI', 'P201', 'Phòng Khám Nhi 1', 'CONSULTATION', 1),
('RM_HCM_XN1', 'DEPT_HCM_XN', 'LAB_01', 'Phòng Lấy Máu Xét Nghiệm', 'LAB', 3),
('RM_HN_N101', 'DEPT_HN_NOI', 'P101_HN', 'Phòng Khám Nội HN', 'CONSULTATION', 1);

-- 5. Thêm Dịch vụ Cơ sở (Facility Services)
INSERT INTO facility_services (facility_services_id, facility_id, department_id, code, name, base_price, insurance_price, estimated_duration_minutes) VALUES
('SRV_KHAMNOI', 'FAC_01', 'DEPT_HCM_NOI', 'KHAM_NOI', 'Khám Nội Tổng Quát', 200000, 50000, 15),
('SRV_KHAMNHI', 'FAC_01', 'DEPT_HCM_NHI', 'KHAM_NHI', 'Khám Nhi Khoa', 250000, 50000, 15),
('SRV_SA_BUNG', 'FAC_01', NULL, 'SA_BUNG', 'Siêu âm ổ bụng', 300000, 100000, 20),
('SRV_XN_MAU', 'FAC_01', 'DEPT_HCM_XN', 'XN_MAU_CB', 'Xét nghiệm Máu Cơ Bản', 150000, 30000, 10);

-- 6. Thêm Thiết bị y tế (Medical Equipment)
INSERT INTO medical_equipment (equipment_id, medical_room_id, code, name, manufacturer, status) VALUES
('EQ_SA_01', 'RM_HCM_N101', 'SA_PHILIPS_01', 'Máy Siêu Âm Philips Affiniti 70', 'Philips', 'ACTIVE'),
('EQ_XN_01', 'RM_HCM_XN1', 'XN_ROCHE_01', 'Hệ thống xét nghiệm miễn dịch Roche', 'Roche', 'ACTIVE');

-- 7. Thêm Giường bệnh (Hospital Beds) cho Khoa Nội
INSERT INTO hospital_beds (beds_id, medical_room_id, code, bed_type, status) VALUES
('BED_HCM_01', 'RM_HCM_N101', 'G01', 'STANDARD', 'AVAILABLE'),
('BED_HCM_02', 'RM_HCM_N101', 'G02', 'STANDARD', 'AVAILABLE'),
('BED_HCM_03', 'RM_HCM_N102', 'G03', 'STANDARD', 'OCCUPIED');
