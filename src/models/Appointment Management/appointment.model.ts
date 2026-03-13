// src/models/Appointment Management/appointment.model.ts

/** Trạng thái lịch khám (State Machine) */
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';

/** Kênh đặt lịch */
export type BookingChannel = 'APP' | 'WEB' | 'HOTLINE' | 'DIRECT_CLINIC' | 'ZALO';

export interface Appointment {
    appointments_id: string;
    appointment_code: string;
    patient_id: string;
    doctor_id?: string | null;
    slot_id?: string | null;
    room_id?: string | null;
    facility_service_id?: string | null;
    appointment_date: string;
    booking_channel: BookingChannel;
    reason_for_visit?: string;
    symptoms_notes?: string;
    status: AppointmentStatus;
    checked_in_at?: string | null;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
    created_at: string;
    updated_at: string;


    patient_name?: string;
    doctor_name?: string;
    room_name?: string;
    service_name?: string;
    slot_start_time?: string;
    slot_end_time?: string;
}

export interface CreateAppointmentInput {
    patient_id: string;
    appointment_date: string;
    booking_channel: BookingChannel;
    reason_for_visit?: string;
    symptoms_notes?: string;
    doctor_id?: string;
    slot_id?: string;
    room_id?: string;
    facility_service_id?: string;
}

export interface UpdateAppointmentInput {
    appointment_date?: string;
    reason_for_visit?: string;
    symptoms_notes?: string;
    doctor_id?: string;
    slot_id?: string;
    room_id?: string;
    facility_service_id?: string;
}
