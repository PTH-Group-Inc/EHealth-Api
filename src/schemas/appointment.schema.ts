import { z } from 'zod';

export const createAppointmentSchema = z.object({
    patient_id: z.string().min(1, "patient_id không được để trống"),
    branch_id: z.string().min(1, "branch_id không được để trống"),
    shift_id: z.string().optional(),
    slot_id: z.string().optional(),
    doctor_id: z.string().optional(),
    facility_id: z.string().optional(),
    specialty_id: z.string().optional(),
    appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "appointment_date phải có định dạng YYYY-MM-DD").refine(date => new Date(date) >= new Date(new Date().setHours(0,0,0,0)), "Ngày khám phải lớn hơn hoặc bằng ngày hiện tại"),
    booking_channel: z.enum(['APP', 'WEB', 'HOTLINE', 'DIRECT_CLINIC', 'ZALO'], {
        message: "booking_channel không hợp lệ"
    }),
    reason_for_visit: z.string().optional(),
    symptoms_notes: z.string().optional(),
    facility_service_id: z.string().optional(),
});
