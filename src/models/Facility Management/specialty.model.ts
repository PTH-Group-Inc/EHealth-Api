/**
 * Interface specialties.
 */
export interface Specialty {
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