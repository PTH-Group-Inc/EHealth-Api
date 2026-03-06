import { FacilityRepository } from '../repository/facility.repository';

export class FacilityService {
    /**
     * Lấy danh sách cơ sở y tế (Facilities) cho Dropdown
     */
    static async getFacilitiesForDropdown() {
        return await FacilityRepository.getFacilitiesForDropdown();
    }
}
