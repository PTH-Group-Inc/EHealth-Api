import { pool } from '../config/postgresdb';
import { FacilityDropdown, FacilityInfo, UpdateFacilityInfoInput } from '../models/facility.model';
import { SYSTEM_ERRORS } from '../constants/system.constant';

export class FacilityRepository {
    /**
     * Lấy danh sách cơ sở y tế (Facilities) cho Dropdown
     */
    static async getFacilitiesForDropdown(): Promise<FacilityDropdown[]> {
        const query = `
            SELECT facilities_id, code, name
            FROM facilities
            WHERE status = 'ACTIVE'
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Lấy thông tin chi tiết cơ sở y tế chính của hệ thống.
     */
    static async getFacilityInfo(): Promise<FacilityInfo | null> {
        const query = `
            SELECT facilities_id, code, name, tax_code, email, phone,
                   website, logo_url, headquarters_address, status, updated_at
            FROM facilities
            WHERE status = 'ACTIVE'
            ORDER BY created_at ASC
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] ?? null;
    }

    /**
     * Cập nhật thông tin tổng quat cơ sở y tế theo ID.
     */
    static async updateFacilityInfo(id: string, input: UpdateFacilityInfoInput): Promise<FacilityInfo> {
        const fields = Object.keys(input) as (keyof UpdateFacilityInfoInput)[];

        const setClauses = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
        const values = fields.map(field => input[field]);

        const query = `
            UPDATE facilities
            SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
            WHERE facilities_id = $1
            RETURNING facilities_id, code, name, tax_code, email, phone,
                      website, logo_url, headquarters_address, status, updated_at
        `;

        const result = await pool.query(query, [id, ...values]);

        if (result.rowCount === 0) {
            throw SYSTEM_ERRORS.FACILITY_NOT_FOUND;
        }
        return result.rows[0];
    }

    /**
     * Cập nhật đường dẫn logo sau khi upload lên Cloudinary thành công.
     */
    static async updateFacilityLogo(id: string, logoUrl: string): Promise<void> {
        const query = `
            UPDATE facilities
            SET logo_url = $2, updated_at = CURRENT_TIMESTAMP
            WHERE facilities_id = $1
        `;
        await pool.query(query, [id, logoUrl]);
    }
}
