-- Dịch vụ cập nhật slot khám từ 15 phút thành 45 phút
-- Xóa tất cả các slot hiện tại và tạo lại theo khoảng thời gian mới

DO $$
DECLARE
    shift_rec RECORD;
    curr_time TIME;
    next_time TIME;
    new_slot_id VARCHAR(50);
BEGIN
    -- Cảnh báo: Việc này sẽ xóa các slot cũ.
    -- Bất kỳ cuộc hẹn nào đã đặt sẽ bị set slot_id = NULL (do ON DELETE SET NULL).
    DELETE FROM appointment_slots;

    -- Duyệt qua tất cả các ca làm việc (shifts) đang có trong hệ thống
    FOR shift_rec IN SELECT * FROM shifts LOOP
        curr_time := shift_rec.start_time;

        -- Tạo slot 45 phút cho tới khi kết thúc ca
        WHILE curr_time + interval '45 minutes' <= shift_rec.end_time LOOP
            next_time := curr_time + interval '45 minutes';
            
            -- Sinh ID tương thích với code TypeScript (SLT_YYMM_XXXXXXXX)
            new_slot_id := 'SLT_' || to_char(CURRENT_DATE, 'YYMM') || '_' || left(md5(random()::text), 8);
            
            INSERT INTO appointment_slots (slot_id, shift_id, start_time, end_time, is_active)
            VALUES (new_slot_id, shift_rec.shifts_id, curr_time, next_time, TRUE);
            
            -- Tiến tới slot tiếp theo
            curr_time := next_time;
        END LOOP;
    END LOOP;
END $$;
