-- =============================================
-- SEED: Notification Categories & Templates
-- Tạo category và template cho hệ thống thông báo lịch hẹn
-- =============================================

-- 1. Category cho Appointment
INSERT INTO notification_categories (notification_categories_id, code, name, description, is_active)
VALUES 
    ('NCAT_APPOINTMENT', 'APPOINTMENT', 'Lịch hẹn khám bệnh', 'Thông báo liên quan đến đặt lịch, xác nhận, check-in, hoàn tất lịch khám', true),
    ('NCAT_SYSTEM', 'SYSTEM', 'Hệ thống', 'Thông báo hệ thống chung', true)
ON CONFLICT (code) DO NOTHING;

-- 2. Templates cho Appointment
INSERT INTO notification_templates (notification_templates_id, category_id, code, name, title_template, body_inapp, body_email, body_push, is_system, is_active)
VALUES 
    -- APPOINTMENT_CREATED
    (
        'NTPL_APT_CREATED',
        'NCAT_APPOINTMENT',
        'APPOINTMENT_CREATED',
        'Đặt lịch khám thành công',
        'Đặt lịch khám thành công - {{appointment_code}}',
        'Bạn đã đặt lịch khám thành công.\n• Mã lịch: {{appointment_code}}\n• Ngày khám: {{appointment_date}}\n• Giờ khám: {{slot_time}}\n• Bác sĩ: {{doctor_name}}\nVui lòng chờ xác nhận từ phòng khám.',
        '<h2>Đặt lịch khám thành công</h2><p>Xin chào <b>{{patient_name}}</b>,</p><p>Bạn đã đặt lịch khám thành công với thông tin:</p><ul><li>Mã lịch: <b>{{appointment_code}}</b></li><li>Ngày khám: <b>{{appointment_date}}</b></li><li>Giờ khám: <b>{{slot_time}}</b></li><li>Bác sĩ: <b>{{doctor_name}}</b></li></ul><p>Vui lòng chờ xác nhận từ phòng khám.</p>',
        'Đặt lịch thành công - Mã: {{appointment_code}}, Ngày: {{appointment_date}}',
        true,
        true
    ),
    -- APPOINTMENT_CONFIRMED
    (
        'NTPL_APT_CONFIRMED',
        'NCAT_APPOINTMENT',
        'APPOINTMENT_CONFIRMED',
        'Xác nhận lịch khám',
        'Lịch khám {{appointment_code}} đã được xác nhận',
        'Lịch khám của bạn đã được xác nhận!\n• Mã lịch: {{appointment_code}}\n• Ngày khám: {{appointment_date}}\n• Giờ khám: {{slot_time}}\n• Bác sĩ: {{doctor_name}}\nVui lòng đến đúng giờ.',
        '<h2>Lịch khám đã được xác nhận</h2><p>Xin chào <b>{{patient_name}}</b>,</p><p>Lịch khám của bạn đã được xác nhận:</p><ul><li>Mã lịch: <b>{{appointment_code}}</b></li><li>Ngày khám: <b>{{appointment_date}}</b></li><li>Giờ khám: <b>{{slot_time}}</b></li><li>Bác sĩ: <b>{{doctor_name}}</b></li></ul><p>Vui lòng đến đúng giờ.</p>',
        'Lịch khám {{appointment_code}} đã xác nhận - {{appointment_date}} {{slot_time}}',
        true,
        true
    ),
    -- APPOINTMENT_CHECKED_IN
    (
        'NTPL_APT_CHECKEDIN',
        'NCAT_APPOINTMENT',
        'APPOINTMENT_CHECKED_IN',
        'Check-in lịch khám',
        'Check-in thành công - {{appointment_code}}',
        'Bạn đã check-in thành công.\n• Mã lịch: {{appointment_code}}\n• Số thứ tự: {{queue_number}}\nVui lòng chờ gọi tên.',
        NULL,
        'Check-in thành công - STT: {{queue_number}}',
        true,
        true
    ),
    -- APPOINTMENT_COMPLETED
    (
        'NTPL_APT_COMPLETED',
        'NCAT_APPOINTMENT',
        'APPOINTMENT_COMPLETED',
        'Hoàn tất lịch khám',
        'Lịch khám {{appointment_code}} đã hoàn tất',
        'Lịch khám {{appointment_code}} đã hoàn tất.\nCảm ơn bạn đã sử dụng dịch vụ.\nVui lòng đánh giá trải nghiệm của bạn.',
        NULL,
        'Lịch khám {{appointment_code}} đã hoàn tất',
        true,
        true
    ),
    -- APPOINTMENT_CANCELLED
    (
        'NTPL_APT_CANCELLED',
        'NCAT_APPOINTMENT',
        'APPOINTMENT_CANCELLED',
        'Hủy lịch khám',
        'Lịch khám {{appointment_code}} đã bị hủy',
        'Lịch khám {{appointment_code}} ngày {{appointment_date}} đã bị hủy.\nLý do: {{cancel_reason}}\nBạn có thể đặt lại lịch khám mới.',
        '<h2>Lịch khám đã bị hủy</h2><p>Xin chào <b>{{patient_name}}</b>,</p><p>Lịch khám <b>{{appointment_code}}</b> ngày <b>{{appointment_date}}</b> đã bị hủy.</p><p>Lý do: {{cancel_reason}}</p><p>Bạn có thể đặt lại lịch khám mới.</p>',
        'Lịch khám {{appointment_code}} đã bị hủy',
        true,
        true
    ),
    -- APPOINTMENT_RESCHEDULED
    (
        'NTPL_APT_RESCHEDULED',
        'NCAT_APPOINTMENT',
        'APPOINTMENT_RESCHEDULED',
        'Dời lịch khám',
        'Lịch khám {{appointment_code}} đã được dời',
        'Lịch khám {{appointment_code}} đã được dời sang ngày {{new_date}} lúc {{new_time}}.\nVui lòng xác nhận lại.',
        NULL,
        'Lịch khám {{appointment_code}} đã dời sang {{new_date}}',
        true,
        true
    ),
    -- APPOINTMENT_REMINDER
    (
        'NTPL_APT_REMINDER',
        'NCAT_APPOINTMENT',
        'APPOINTMENT_REMINDER',
        'Nhắc lịch khám',
        'Nhắc lịch: Bạn có lịch khám ngày {{appointment_date}}',
        'Nhắc nhở: Bạn có lịch khám sắp tới.\n• Mã lịch: {{appointment_code}}\n• Ngày khám: {{appointment_date}}\n• Giờ khám: {{slot_time}}\n• Bác sĩ: {{doctor_name}}\nVui lòng đến đúng giờ.',
        '<h2>Nhắc lịch khám</h2><p>Xin chào <b>{{patient_name}}</b>,</p><p>Bạn có lịch khám sắp tới:</p><ul><li>Mã lịch: <b>{{appointment_code}}</b></li><li>Ngày khám: <b>{{appointment_date}}</b></li><li>Giờ khám: <b>{{slot_time}}</b></li><li>Bác sĩ: <b>{{doctor_name}}</b></li></ul><p>Vui lòng đến đúng giờ.</p>',
        'Nhắc lịch: {{appointment_code}} - {{appointment_date}} {{slot_time}}',
        true,
        true
    )
ON CONFLICT (code) DO NOTHING;
