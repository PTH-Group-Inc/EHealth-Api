-- Migration: Tạo bảng liên kết Khoa ↔ Chuyên khoa
-- Mục đích: Phân phòng đúng khoa khi đặt lịch (VD: BN Nhi → Phòng Nhi)

CREATE TABLE IF NOT EXISTS department_specialties (
    department_specialty_id VARCHAR(50) PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL,
    specialty_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(departments_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES specialties(specialties_id) ON DELETE CASCADE,
    UNIQUE(department_id, specialty_id)
);

-- Index để tìm nhanh department từ specialty
CREATE INDEX IF NOT EXISTS idx_dept_spec_specialty ON department_specialties(specialty_id);
CREATE INDEX IF NOT EXISTS idx_dept_spec_department ON department_specialties(department_id);

-- ============================================================
-- INSERT DỮ LIỆU MẪU (tuỳ chỉnh theo phòng khám thực tế)
-- ============================================================
-- VD: Khoa Nhi ↔ Chuyên khoa Nhi
-- INSERT INTO department_specialties VALUES ('DS_001', 'DEPT_NHI', 'SPEC_NHI');
-- INSERT INTO department_specialties VALUES ('DS_002', 'DEPT_NOI', 'SPEC_TIM_MACH');
-- INSERT INTO department_specialties VALUES ('DS_003', 'DEPT_NOI', 'SPEC_NOI_TONG_QUAT');
