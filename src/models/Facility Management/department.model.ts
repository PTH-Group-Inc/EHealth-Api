export interface DepartmentDropdown {
    /** Canonical alias snake_case (#7). */
    department_id?: string;
    /** @deprecated giữ tạm để backward compat (BACKEND_TASKS #7). Dùng `department_id`. */
    departments_id: string;
    branch_id: string;
    code: string;
    name: string;
}

export interface DepartmentInfo extends DepartmentDropdown {
    description?: string;
    logo_url?: string | null;
    status: string;
    branch_name?: string;
    facility_name?: string;
    // Aggregate stats (computed in repository via LEFT JOIN). Default 0 nếu không có.
    doctor_count?: number;
    appointment_today?: number;
    patient_count?: number;
}

export interface CreateDepartmentInput {
    branch_id: string;
    code?: string;  // optional - BE auto-gen nếu không truyền (FE bỏ field Mã)
    name: string;
    description?: string;
    logo_url?: string;
}

export interface UpdateDepartmentInput {
    name?: string;
    description?: string;
    logo_url?: string;
}

export interface DepartmentQuery {
    page?: number;
    limit?: number;
    search?: string;
    branch_id?: string;
    status?: string;
}
