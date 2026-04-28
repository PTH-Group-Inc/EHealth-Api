-- Script thêm ngày lễ và đặt lịch hẹn cho bệnh nhân (từ hôm nay đến 15/05)
-- Yêu cầu: 
-- 1. Thêm các ngày nghỉ 30/4, 1/5 và nghỉ bù 2/5, 3/5.
-- 2. Đặt lịch rải rác từ hôm nay đến 15/5, trừ các ngày nghỉ.
-- 3. Lịch hẹn ngày hôm nay có status = CHECKED_IN, ngày tương lai status = CONFIRMED.

DO $$
DECLARE
    v_branch_id VARCHAR(50);
    v_facility_id VARCHAR(50);
    
    v_date DATE;
    v_end_date DATE := '2026-05-15';
    v_patient RECORD;
    v_doctor RECORD;
    v_slot RECORD;
    
    v_status VARCHAR(50);
    v_new_apt_id VARCHAR(50);
    v_count INT := 0;
BEGIN
    -- 1. Tìm ID của chi nhánh BR_MAIN và cơ sở tương ứng
    SELECT branches_id, facility_id INTO v_branch_id, v_facility_id
    FROM branches WHERE branches_id = 'BR_MAIN' LIMIT 1;

    IF v_facility_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy facility_id cho chi nhánh BR_MAIN';
    END IF;

    -- 2. Thêm các ngày nghỉ lễ vào bảng facility_holidays (nếu chưa có)
    -- Lễ 30/4
    IF NOT EXISTS (SELECT 1 FROM facility_holidays WHERE facility_id = v_facility_id AND holiday_date = '2026-04-30') THEN
        INSERT INTO facility_holidays (holiday_id, facility_id, holiday_date, title, is_closed, is_recurring)
        VALUES ('HOL_' || to_char(CURRENT_DATE, 'YYMM') || '_' || left(md5(random()::text), 8), v_facility_id, '2026-04-30', 'Giải phóng miền Nam 30/4', TRUE, TRUE);
    END IF;
    
    -- Lễ 1/5
    IF NOT EXISTS (SELECT 1 FROM facility_holidays WHERE facility_id = v_facility_id AND holiday_date = '2026-05-01') THEN
        INSERT INTO facility_holidays (holiday_id, facility_id, holiday_date, title, is_closed, is_recurring)
        VALUES ('HOL_' || to_char(CURRENT_DATE, 'YYMM') || '_' || left(md5(random()::text), 8), v_facility_id, '2026-05-01', 'Quốc tế Lao động 1/5', TRUE, TRUE);
    END IF;

    -- Nghỉ bù 2/5
    IF NOT EXISTS (SELECT 1 FROM facility_holidays WHERE facility_id = v_facility_id AND holiday_date = '2026-05-02') THEN
        INSERT INTO facility_holidays (holiday_id, facility_id, holiday_date, title, is_closed, is_recurring)
        VALUES ('HOL_' || to_char(CURRENT_DATE, 'YYMM') || '_' || left(md5(random()::text), 8), v_facility_id, '2026-05-02', 'Nghỉ bù lễ 30/4', TRUE, FALSE);
    END IF;

    -- Nghỉ bù 3/5
    IF NOT EXISTS (SELECT 1 FROM facility_holidays WHERE facility_id = v_facility_id AND holiday_date = '2026-05-03') THEN
        INSERT INTO facility_holidays (holiday_id, facility_id, holiday_date, title, is_closed, is_recurring)
        VALUES ('HOL_' || to_char(CURRENT_DATE, 'YYMM') || '_' || left(md5(random()::text), 8), v_facility_id, '2026-05-03', 'Nghỉ bù lễ 1/5', TRUE, FALSE);
    END IF;

    -- 3. Tạo lịch hẹn (Appointments) phân bổ rải rác
    v_date := CURRENT_DATE;
    
    WHILE v_date <= v_end_date LOOP
        -- Nếu là ngày lễ thì bỏ qua, không đặt lịch
        IF v_date IN ('2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03') THEN
            v_date := v_date + INTERVAL '1 day';
            CONTINUE;
        END IF;

        -- Xác định trạng thái dựa trên ngày:
        -- - Hôm nay: CHECKED_IN
        -- - Tương lai: CONFIRMED
        IF v_date = CURRENT_DATE THEN
            v_status := 'CHECKED_IN';
        ELSE
            v_status := 'CONFIRMED';
        END IF;

        -- Mỗi ngày chọn ngẫu nhiên vài bệnh nhân để đặt lịch (ở đây gán là 5 bệnh nhân)
        FOR v_patient IN (SELECT * FROM patients WHERE deleted_at IS NULL ORDER BY random() LIMIT 5) LOOP
            
            -- Chọn một bác sĩ ngẫu nhiên CÓ LỊCH làm việc vào ngày này tại BR_MAIN
            SELECT d.doctors_id, s.medical_room_id, s.shift_id, s.start_time, s.end_time 
            INTO v_doctor
            FROM staff_schedules s
            JOIN doctors d ON d.user_id = s.user_id
            WHERE s.working_date = v_date AND s.status = 'ACTIVE'
            ORDER BY random() LIMIT 1;

            IF v_doctor.doctors_id IS NOT NULL THEN
                -- Lấy ngẫu nhiên 1 slot trống trong ca của bác sĩ này
                SELECT * INTO v_slot 
                FROM appointment_slots 
                WHERE shift_id = v_doctor.shift_id 
                  AND start_time >= v_doctor.start_time
                  AND end_time <= v_doctor.end_time
                ORDER BY random() LIMIT 1;

                IF v_slot.slot_id IS NOT NULL THEN
                    v_new_apt_id := 'APT_' || to_char(CURRENT_DATE, 'YYMM') || '_' || left(md5(random()::text), 8);
                    
                    INSERT INTO appointments (
                        appointments_id, appointment_code, patient_id, doctor_id, room_id, slot_id, 
                        branch_id, appointment_date, booking_channel, status
                    ) VALUES (
                        v_new_apt_id, v_new_apt_id, v_patient.id, v_doctor.doctors_id, v_doctor.medical_room_id, v_slot.slot_id,
                        v_branch_id, v_date, 'APP', v_status
                    );
                    
                    v_count := v_count + 1;
                END IF;
            END IF;
        END LOOP;

        -- Tăng lên 1 ngày
        v_date := v_date + INTERVAL '1 day';
    END LOOP;

    RAISE NOTICE 'Đã thêm ngày lễ và tạo thành công % lịch hẹn', v_count;
END $$;
