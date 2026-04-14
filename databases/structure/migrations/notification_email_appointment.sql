-- ============================================
-- Migration M2: Email Appointment Flow
--
-- Bật allow_email cho các role:
--   - PATIENT: nhận email tất cả appointment events (CREATED, CONFIRMED, REMINDER, ...)
--   - DOCTOR: nhận email khi có lịch mới được tạo/đổi (optional)
--   - STAFF: nhận email cảnh báo no-show (optional)
--
-- Idempotent: chạy nhiều lần không lỗi (ON CONFLICT)
-- ============================================

-- 1. PATIENT — bật in-app + email cho category APPOINTMENT
INSERT INTO notification_role_configs (notification_role_configs_id, role_id, category_id, allow_inapp, allow_email, allow_push)
VALUES
    ('NRC_PATIENT_APT', 'ROLE_PATIENT', 'NCAT_APPOINTMENT', TRUE, TRUE, TRUE)
ON CONFLICT (notification_role_configs_id) DO UPDATE
SET allow_inapp = TRUE, allow_email = TRUE, allow_push = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- 2. DOCTOR — bật in-app + email cho category APPOINTMENT (BS muốn biết khi có lịch mới)
INSERT INTO notification_role_configs (notification_role_configs_id, role_id, category_id, allow_inapp, allow_email, allow_push)
VALUES
    ('NRC_DOCTOR_APT', 'ROLE_DOCTOR', 'NCAT_APPOINTMENT', TRUE, TRUE, FALSE)
ON CONFLICT (notification_role_configs_id) DO UPDATE
SET allow_inapp = TRUE, allow_email = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- 3. STAFF (lễ tân) — chỉ in-app, không email
INSERT INTO notification_role_configs (notification_role_configs_id, role_id, category_id, allow_inapp, allow_email, allow_push)
VALUES
    ('NRC_STAFF_APT', 'ROLE_STAFF', 'NCAT_APPOINTMENT', TRUE, FALSE, FALSE)
ON CONFLICT (notification_role_configs_id) DO UPDATE
SET allow_inapp = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- 4. NURSE (y tá) — chỉ in-app
INSERT INTO notification_role_configs (notification_role_configs_id, role_id, category_id, allow_inapp, allow_email, allow_push)
VALUES
    ('NRC_NURSE_APT', 'ROLE_NURSE', 'NCAT_APPOINTMENT', TRUE, FALSE, FALSE)
ON CONFLICT (notification_role_configs_id) DO UPDATE
SET allow_inapp = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- 5. Cập nhật / thêm body_email cho các template appointment chưa có
--    (template_codes thuộc category APPOINTMENT)
-- ============================================

-- APPOINTMENT_REMINDER — đã seed nhưng chưa có body_email đẹp
UPDATE notification_templates
SET body_email = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Segoe UI,sans-serif;background:#f4f6f8;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#3C81C6;padding:24px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px}.content{padding:30px 25px;color:#333;line-height:1.6}.info-box{background:#e3f2fd;border-left:4px solid #1e88e5;padding:15px;border-radius:4px;margin:20px 0}.info-box ul{margin:0;padding-left:20px}.btn{display:inline-block;padding:12px 28px;background:#3C81C6;color:#fff;text-decoration:none;border-radius:24px;font-weight:600;margin:15px 0}.footer{background:#f8f9fa;padding:18px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee}</style></head><body><div class="container"><div class="header"><h1>⏰ Nhắc lịch khám</h1></div><div class="content"><p>Xin chào <b>{{patient_name}}</b>,</p><p>Đây là email nhắc nhở rằng bạn có lịch khám sắp tới:</p><div class="info-box"><ul><li>📋 Mã lịch: <b>{{appointment_code}}</b></li><li>📅 Ngày khám: <b>{{appointment_date}}</b></li><li>⏰ Giờ khám: <b>{{slot_time}}</b></li><li>👨‍⚕️ Bác sĩ: <b>{{doctor_name}}</b></li></ul></div><p><b>Vui lòng đến trước giờ hẹn 15 phút</b> để làm thủ tục check-in. Mang theo CMND/CCCD và thẻ BHYT (nếu có).</p><p>Nếu cần đổi lịch hoặc hủy, vui lòng liên hệ trước 24h.</p></div><div class="footer">© 2026 EHealth Hospital — Email tự động, vui lòng không reply</div></div></body></html>'
WHERE code = 'APPOINTMENT_REMINDER';

-- APPOINTMENT_NO_SHOW — thêm template mới nếu chưa có
INSERT INTO notification_templates (
    notification_templates_id, category_id, code, name, title_template, body_inapp, body_email, body_push, is_system, is_active
)
VALUES (
    'NTPL_APT_NOSHOW',
    'NCAT_APPOINTMENT',
    'APPOINTMENT_NO_SHOW',
    'Cảnh báo không đến khám',
    'Bạn đã vắng mặt lịch khám {{appointment_code}}',
    'Bạn đã không đến lịch khám đã đặt:\n• Mã lịch: {{appointment_code}}\n• Ngày khám: {{appointment_date}}\n• Bác sĩ: {{doctor_name}}\nVui lòng đặt lịch lại nếu cần khám.',
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Segoe UI,sans-serif;background:#f4f6f8;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#e53935;padding:24px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px}.content{padding:30px 25px;color:#333;line-height:1.6}.info-box{background:#ffebee;border-left:4px solid #e53935;padding:15px;border-radius:4px;margin:20px 0}.btn{display:inline-block;padding:12px 28px;background:#3C81C6;color:#fff;text-decoration:none;border-radius:24px;font-weight:600;margin:15px 0}.footer{background:#f8f9fa;padding:18px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee}</style></head><body><div class="container"><div class="header"><h1>⚠️ Bạn đã không đến lịch khám</h1></div><div class="content"><p>Xin chào <b>{{patient_name}}</b>,</p><p>Hệ thống ghi nhận bạn đã không đến lịch khám đã đặt:</p><div class="info-box"><ul><li>Mã lịch: <b>{{appointment_code}}</b></li><li>Ngày khám: <b>{{appointment_date}}</b></li><li>Giờ khám: <b>{{slot_time}}</b></li><li>Bác sĩ: <b>{{doctor_name}}</b></li></ul></div><p>Nếu vẫn cần khám, vui lòng đặt lịch lại. Lưu ý: việc vắng mặt nhiều lần có thể ảnh hưởng đến uy tín đặt lịch của bạn.</p></div><div class="footer">© 2026 EHealth Hospital</div></div></body></html>',
    'Bạn đã vắng mặt lịch khám {{appointment_code}}',
    true,
    true
)
ON CONFLICT (notification_templates_id) DO NOTHING;

-- ============================================
-- 6. Update các template hiện có với HTML đẹp hơn (branding EHealth)
-- ============================================

UPDATE notification_templates
SET body_email = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Segoe UI,sans-serif;background:#f4f6f8;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#3C81C6;padding:24px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px}.content{padding:30px 25px;color:#333;line-height:1.6}.info-box{background:#e8f5e9;border-left:4px solid #43a047;padding:15px;border-radius:4px;margin:20px 0}.info-box ul{margin:0;padding-left:20px}.btn{display:inline-block;padding:12px 28px;background:#3C81C6;color:#fff;text-decoration:none;border-radius:24px;font-weight:600;margin:15px 0}.footer{background:#f8f9fa;padding:18px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee}</style></head><body><div class="container"><div class="header"><h1>✅ Đặt lịch khám thành công</h1></div><div class="content"><p>Xin chào <b>{{patient_name}}</b>,</p><p>Cảm ơn bạn đã đặt lịch khám tại <b>EHealth Hospital</b>. Lịch khám của bạn đã được ghi nhận:</p><div class="info-box"><ul><li>📋 Mã lịch: <b>{{appointment_code}}</b></li><li>📅 Ngày khám: <b>{{appointment_date}}</b></li><li>⏰ Giờ khám: <b>{{slot_time}}</b></li><li>👨‍⚕️ Bác sĩ: <b>{{doctor_name}}</b></li></ul></div><p><b>Trạng thái:</b> Đang chờ phòng khám xác nhận. Bạn sẽ nhận được email khác khi lịch được xác nhận chính thức.</p><p style="font-size:13px;color:#666"><b>Lưu ý:</b> Vui lòng đến trước giờ hẹn 15 phút để check-in.</p></div><div class="footer">© 2026 EHealth Hospital — Hotline: 1900 1234</div></div></body></html>'
WHERE code = 'APPOINTMENT_CREATED';

UPDATE notification_templates
SET body_email = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Segoe UI,sans-serif;background:#f4f6f8;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#43a047;padding:24px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px}.content{padding:30px 25px;color:#333;line-height:1.6}.info-box{background:#e8f5e9;border-left:4px solid #43a047;padding:15px;border-radius:4px;margin:20px 0}.info-box ul{margin:0;padding-left:20px}.footer{background:#f8f9fa;padding:18px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee}</style></head><body><div class="container"><div class="header"><h1>✓ Lịch khám đã được xác nhận</h1></div><div class="content"><p>Xin chào <b>{{patient_name}}</b>,</p><p>Lịch khám của bạn đã được phòng khám <b>xác nhận chính thức</b>:</p><div class="info-box"><ul><li>📋 Mã lịch: <b>{{appointment_code}}</b></li><li>📅 Ngày khám: <b>{{appointment_date}}</b></li><li>⏰ Giờ khám: <b>{{slot_time}}</b></li><li>👨‍⚕️ Bác sĩ: <b>{{doctor_name}}</b></li></ul></div><p><b>Hẹn gặp bạn vào ngày khám!</b> Vui lòng đến trước 15 phút và mang theo:</p><ul><li>CMND/CCCD</li><li>Thẻ BHYT (nếu có)</li><li>Kết quả khám lần trước (nếu có)</li></ul></div><div class="footer">© 2026 EHealth Hospital — Hotline: 1900 1234</div></div></body></html>'
WHERE code = 'APPOINTMENT_CONFIRMED';

UPDATE notification_templates
SET body_email = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Segoe UI,sans-serif;background:#f4f6f8;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#e53935;padding:24px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px}.content{padding:30px 25px;color:#333;line-height:1.6}.info-box{background:#ffebee;border-left:4px solid #e53935;padding:15px;border-radius:4px;margin:20px 0}.footer{background:#f8f9fa;padding:18px;text-align:center;font-size:12px;color:#888}</style></head><body><div class="container"><div class="header"><h1>❌ Lịch khám đã bị hủy</h1></div><div class="content"><p>Xin chào <b>{{patient_name}}</b>,</p><p>Lịch khám của bạn đã bị hủy:</p><div class="info-box"><ul><li>Mã lịch: <b>{{appointment_code}}</b></li><li>Ngày khám: <b>{{appointment_date}}</b></li><li>Lý do: <b>{{cancel_reason}}</b></li></ul></div><p>Nếu bạn không phải người hủy hoặc muốn đặt lịch lại, vui lòng liên hệ phòng khám.</p></div><div class="footer">© 2026 EHealth Hospital</div></div></body></html>'
WHERE code = 'APPOINTMENT_CANCELLED';

UPDATE notification_templates
SET body_email = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Segoe UI,sans-serif;background:#f4f6f8;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#fb8c00;padding:24px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px}.content{padding:30px 25px;color:#333;line-height:1.6}.info-box{background:#fff3e0;border-left:4px solid #fb8c00;padding:15px;border-radius:4px;margin:20px 0}.footer{background:#f8f9fa;padding:18px;text-align:center;font-size:12px;color:#888}</style></head><body><div class="container"><div class="header"><h1>📅 Lịch khám đã được dời</h1></div><div class="content"><p>Xin chào <b>{{patient_name}}</b>,</p><p>Lịch khám của bạn đã được <b>dời sang thời gian mới</b>:</p><div class="info-box"><ul><li>Mã lịch: <b>{{appointment_code}}</b></li><li>📅 Ngày mới: <b>{{appointment_date}}</b></li><li>⏰ Giờ mới: <b>{{slot_time}}</b></li><li>👨‍⚕️ Bác sĩ: <b>{{doctor_name}}</b></li></ul></div><p>Nếu thời gian mới không phù hợp, vui lòng liên hệ phòng khám để đổi lịch khác.</p></div><div class="footer">© 2026 EHealth Hospital</div></div></body></html>'
WHERE code = 'APPOINTMENT_RESCHEDULED';

UPDATE notification_templates
SET body_email = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Segoe UI,sans-serif;background:#f4f6f8;padding:20px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#43a047;padding:24px;text-align:center}.header h1{color:#fff;margin:0;font-size:22px}.content{padding:30px 25px;color:#333;line-height:1.6}.btn{display:inline-block;padding:12px 28px;background:#3C81C6;color:#fff;text-decoration:none;border-radius:24px;font-weight:600;margin:15px 0}.footer{background:#f8f9fa;padding:18px;text-align:center;font-size:12px;color:#888}</style></head><body><div class="container"><div class="header"><h1>🎉 Khám bệnh hoàn tất</h1></div><div class="content"><p>Xin chào <b>{{patient_name}}</b>,</p><p>Buổi khám của bạn đã hoàn tất. Bạn có thể xem chi tiết kết quả khám và đơn thuốc trên ứng dụng EHealth.</p><p><b>Lịch khám:</b> {{appointment_code}} — Bác sĩ {{doctor_name}}</p><p><b>Cảm ơn bạn đã tin tưởng EHealth Hospital!</b></p><p>Nếu có bất kỳ thắc mắc gì về kết quả khám hoặc cách dùng thuốc, vui lòng liên hệ chúng tôi.</p></div><div class="footer">© 2026 EHealth Hospital — Hotline: 1900 1234</div></div></body></html>'
WHERE code = 'APPOINTMENT_COMPLETED';
