export interface BranchInfo {
    /** Canonical alias snake_case (#7). */
    branch_id?: string;
    /** @deprecated giữ tạm để backward compat (BACKEND_TASKS #7). Dùng `branch_id`. */
    branches_id: string;
    facility_id: string;
    code: string;
    name: string;
    address: string;
    phone: string | null;
    status: string;
    established_date: Date | null;
    logo_url?: string | null;
    facility_name?: string;
    deleted_at?: Date | null;
}

export interface BranchDropdown {
    /** Canonical alias snake_case (#7). */
    branch_id?: string;
    /** @deprecated giữ tạm để backward compat (BACKEND_TASKS #7). */
    branches_id: string;
    facility_id: string;
    code: string;
    name: string;
}

// Input tạo mới chi nhánh
export interface CreateBranchInput {
    facility_id: string;
    code?: string;  // optional - BE auto-gen nếu không truyền (FE bỏ field Mã)
    name: string;
    address: string;
    phone?: string;
    established_date?: string;
    logo_url?: string;
}

// Input cập nhật thông tin chi nhánh
export interface UpdateBranchInput {
    facility_id?: string;
    name?: string;
    address?: string;
    phone?: string;
    established_date?: string;
    logo_url?: string;
}

// Query filter cho danh sách chi nhánh
export interface BranchQuery {
    search?: string;
    facility_id?: string;
    status?: string;
    page: number;
    limit: number;
}
