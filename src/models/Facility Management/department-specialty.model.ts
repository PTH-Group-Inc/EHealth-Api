/**
 * Liên kết N-N giữa Khoa/Phòng ban và Chuyên khoa
 */
export interface DepartmentSpecialty {
    department_specialty_id: string;
    department_id: string;
    specialty_id: string;
    created_at?: Date;

    specialty_code?: string;
    specialty_name?: string;
    specialty_description?: string;

    department_code?: string;
    department_name?: string;
    branch_id?: string;
    branch_name?: string;
    facility_name?: string;
}

export interface AssignDepartmentSpecialtiesInput {
    specialty_ids: string[];
}
