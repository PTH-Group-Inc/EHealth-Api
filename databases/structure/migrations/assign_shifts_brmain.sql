-- Script phân ca làm việc cho toàn bộ nhân viên chi nhánh BR_MAIN trong 2 tháng tới
-- Yêu cầu: Phân đều ca sáng, ca chiều, ca tối ít hơn.

DO $$
DECLARE
    v_branch_id VARCHAR(50);
    v_facility_id VARCHAR(50);
    
    v_morning_shift RECORD;
    v_afternoon_shift RECORD;
    v_night_shift RECORD;
    
    v_user_id VARCHAR(50);
    v_room_id VARCHAR(50);
    
    v_date DATE;
    v_end_date DATE := CURRENT_DATE + INTERVAL '2 months';
    
    v_shift_choice NUMERIC;
    v_selected_shift RECORD;
    v_new_id VARCHAR(50);
BEGIN
    -- 1. Tìm ID của chi nhánh BR_MAIN và cơ sở (facility) tương ứng
    SELECT branches_id, facility_id INTO v_branch_id, v_facility_id
    FROM branches WHERE branches_id = 'BR_MAIN' LIMIT 1;

    IF v_branch_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy chi nhánh BR_MAIN';
    END IF;

    -- 2. Lấy thông tin các ca làm việc (Shifts) của cơ sở này
    SELECT * INTO v_morning_shift FROM shifts WHERE facility_id = v_facility_id AND code = 'MORNING' LIMIT 1;
    SELECT * INTO v_afternoon_shift FROM shifts WHERE facility_id = v_facility_id AND code = 'AFTERNOON' LIMIT 1;
    SELECT * INTO v_night_shift FROM shifts WHERE facility_id = v_facility_id AND code = 'NIGHT' LIMIT 1;

    -- Xóa các lịch cũ trong 2 tháng tới của nhân viên thuộc BR_MAIN để phân lại từ đầu (tránh trùng lặp)
    DELETE FROM staff_schedules 
    WHERE working_date >= CURRENT_DATE 
      AND working_date <= v_end_date
      AND user_id IN (SELECT user_id FROM user_branch_dept WHERE branch_id = v_branch_id);

    -- 3. Duyệt qua từng nhân viên thuộc chi nhánh BR_MAIN (chỉ lấy trạng thái ACTIVE)
    FOR v_user_id IN (SELECT user_id FROM user_branch_dept WHERE branch_id = v_branch_id AND status = 'ACTIVE') LOOP
        
        -- Lấy một phòng ngẫu nhiên thuộc chi nhánh này cho nhân viên
        -- (Thực tế có thể chia theo phòng ban, nhưng script sẽ gán random để đảm bảo có phòng hợp lệ)
        SELECT medical_rooms_id INTO v_room_id 
        FROM medical_rooms 
        WHERE branch_id = v_branch_id 
        ORDER BY random() LIMIT 1;
        
        IF v_room_id IS NULL THEN
            CONTINUE; -- Bỏ qua nếu chi nhánh chưa được cấu hình phòng
        END IF;

        v_date := CURRENT_DATE;
        
        -- 4. Tạo lịch cho từng ngày trong 2 tháng tới
        WHILE v_date <= v_end_date LOOP
            -- Xác suất: 45% ca sáng, 45% ca chiều, 10% ca tối
            v_shift_choice := random();
            
            IF v_shift_choice < 0.45 THEN
                v_selected_shift := v_morning_shift;
            ELSIF v_shift_choice < 0.90 THEN
                v_selected_shift := v_afternoon_shift;
            ELSE
                v_selected_shift := v_night_shift;
            END IF;
            
            -- Chỉ chèn nếu hệ thống có tồn tại ca làm việc đó
            IF v_selected_shift.shifts_id IS NOT NULL THEN
                v_new_id := 'SCH_' || to_char(CURRENT_DATE, 'YYMM') || '_' || left(md5(random()::text), 8);
                
                INSERT INTO staff_schedules (
                    staff_schedules_id, user_id, medical_room_id, shift_id, 
                    working_date, start_time, end_time, is_leave, status
                ) VALUES (
                    v_new_id, v_user_id, v_room_id, v_selected_shift.shifts_id,
                    v_date, v_selected_shift.start_time, v_selected_shift.end_time, FALSE, 'ACTIVE'
                );
            END IF;

            -- Tiến tới ngày tiếp theo
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE 'Đã phân ca thành công cho toàn bộ nhân viên chi nhánh BR_MAIN trong 2 tháng tới!';
END $$;
