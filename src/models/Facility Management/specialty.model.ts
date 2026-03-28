/**
 * Interface specialties.
 */
export interface Specialty {
    specialties_id: string;
    code: string;
    name: string;
    description: string | null;
    logo_url?: string | null;
}

/**
 * Payload
 */
export interface SpecialtyPayloadDTO {
    code: string;
    name: string;
    description?: string;
    logo_url?: string;
}