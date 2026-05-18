/**
 * Entity đại diện cho Nhóm thuốc
 */
export interface DrugCategory {
    /** Canonical alias snake_case (#7). */
    drug_category_id?: string;
    /** @deprecated giữ tạm để backward compat (BACKEND_TASKS #7). Dùng `drug_category_id`. */
    drug_categories_id: string;
    code: string;
    name: string;
    description: string | null;
    deleted_at?: Date | null;
}

/**
 * Payload tạo mới nhóm thuốc
 */
export interface CreateDrugCategoryInput {
    code?: string;
    name: string;
    description?: string;
}

/**
 * Payload cập nhật nhóm thuốc
 */
export interface UpdateDrugCategoryInput {
    name?: string;
    description?: string;
}

/**
 * Model trả về khi phân trang
 */
export interface PaginatedDrugCategories {
    data: DrugCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
