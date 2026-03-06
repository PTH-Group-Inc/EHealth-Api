import { RoleRepository } from '../repository/role.repository';

export class RoleService {
    /**
     * Lấy danh sách role cho Dropdown
     */
    static async getAllRoles() {
        return await RoleRepository.getAllRoles();
    }
}
