-- Migration Script for 1.8 Logging & Audit Module
-- Bảng lưu vết toàn bộ thao tác hệ thống (Audit Logs)

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50), -- Nullable nếu là thao tác hệ thống tự động, nếu thao tác do User thì link qua bảng users
    action_type VARCHAR(50) NOT NULL, -- CREATE | UPDATE | DELETE | LOGIN | EXPORT | OTHER
    module_name VARCHAR(100) NOT NULL, -- Tên phân hệ (DRUG, PATIENT, DOCTOR, ...)
    target_id VARCHAR(100), -- ID của bản ghi bị tác động (Ví dụ ID của lọ thuốc)
    old_value JSONB, -- Dữ liệu trước khi sửa (Nếu có)
    new_value JSONB, -- Dữ liệu mới cập nhật (Payload Body)
    ip_address VARCHAR(45), -- Lưu IPv4 hoặc IPv6
    user_agent TEXT, -- Trình duyệt, OS của Client
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Index để tối ưu hóa tốc độ tìm kiếm log trên trang Admin
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_module ON audit_logs(module_name);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
