/**
 * Pagination utilities — chuẩn hoá payload phân trang cho các controller.
 *
 * Mục tiêu:
 *  - Tránh tình trạng mỗi endpoint tự build pagination object → một số endpoint thiếu `totalPages` hoặc `total`.
 *  - Có chỗ duy nhất để chỉnh sửa nếu sau này đổi convention (vd: dùng `pageCount` thay `totalPages`).
 *
 * Cách dùng:
 * ```ts
 * import { paginatedResponse } from '@/utils/pagination.util';
 *
 * return res.json(paginatedResponse(items, page, limit, total));
 * ```
 */

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedPayload<T> {
    success: true;
    data: T[];
    pagination: PaginationMeta;
}

/**
 * Build pagination metadata. Tự clamp các giá trị âm/0 về mức an toàn.
 *
 * - `page` tối thiểu là 1.
 * - `limit` tối thiểu là 1 (để tránh chia cho 0 khi tính totalPages).
 * - `total` tối thiểu là 0.
 * - `totalPages` = ceil(total/limit), nhưng nếu total = 0 thì trả về 1 (tránh hiển thị "page 1/0").
 */
export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.max(1, Math.floor(limit) || 1);
    const safeTotal = Math.max(0, Math.floor(total) || 0);
    return {
        page: safePage,
        limit: safeLimit,
        total: safeTotal,
        totalPages: safeTotal === 0 ? 1 : Math.ceil(safeTotal / safeLimit),
    };
}

/**
 * Wrap kết quả truy vấn thành response paginate chuẩn.
 *
 * Convention:
 * ```json
 * {
 *   "success": true,
 *   "data": [...],
 *   "pagination": { "page": 1, "limit": 20, "total": 145, "totalPages": 8 }
 * }
 * ```
 */
export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
): PaginatedPayload<T> {
    return {
        success: true,
        data,
        pagination: buildPagination(page, limit, total),
    };
}

/**
 * Parse query string `page` & `limit` an toàn (clamp giới hạn trên cho limit để tránh DoS).
 *
 * @param maxLimit  Mặc định 100. Endpoint export Excel có thể cho phép cao hơn.
 */
export function parsePageQuery(
    pageRaw: unknown,
    limitRaw: unknown,
    defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): { page: number; limit: number; offset: number } {
    const defaultPage = defaults.page ?? 1;
    const defaultLimit = defaults.limit ?? 20;
    const maxLimit = defaults.maxLimit ?? 100;

    const pageNum = Number(pageRaw);
    const limitNum = Number(limitRaw);

    const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : defaultPage;
    const rawLimit = Number.isFinite(limitNum) && limitNum > 0 ? Math.floor(limitNum) : defaultLimit;
    const limit = Math.min(rawLimit, maxLimit);

    return {
        page,
        limit,
        offset: (page - 1) * limit,
    };
}
