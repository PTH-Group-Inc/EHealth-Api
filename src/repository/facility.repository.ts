import { pool } from '../config/postgresdb';
import { FacilityDropdown } from '../models/facility.model';

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
}
