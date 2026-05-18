/**
 * Interface specialties.
 */
export interface Specialty {
    /** Canonical alias snake_case (#7). */
    specialty_id?: string;
    /** @deprecated giữ tạm để backward compat (BACKEND_TASKS #7). Dùng `specialty_id`. */
    specialties_id: string;
    code: string;
    name: string;
    description: string | null;
    logo_url?: string | null;
    // Aggregate stats (computed in repository via LEFT JOIN). Default 0 nếu không có.
    service_count?: number;
    doctor_count?: number;
}

/**
 * Payload
 */
export interface SpecialtyPayloadDTO {
    code?: string;
    name: string;
    description?: string;
    logo_url?: string;
}