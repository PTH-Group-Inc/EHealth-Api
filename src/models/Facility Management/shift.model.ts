// src/models/shift.model.ts
export interface Shift {
    /** Canonical alias snake_case (#7). */
    shift_id?: string;
    /** @deprecated giữ tạm để backward compat (BACKEND_TASKS #7). Dùng `shift_id`. */
    shifts_id: string;
    facility_id: string;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}

export interface CreateShiftInput {
    facility_id: string;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
    description?: string;
}

export interface UpdateShiftInput {
    code?: string;
    name?: string;
    start_time?: string;
    end_time?: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}
