import { DepartmentSpecialtyRepository } from '../../repository/Facility Management/department-specialty.repository';
import { DepartmentSpecialty } from '../../models/Facility Management/department-specialty.model';
import { DEPARTMENT_SPECIALTY_ERRORS } from '../../constants/medical-service.constant';

/** Prefix cho department_specialty_id */
const ID_PREFIX = 'DSPC';

/**
 * Sinh ID dạng DSPC_YYMMDD_randomHex
 */
function generateDepartmentSpecialtyId(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hex = Math.random().toString(16).slice(2, 12);
    return `${ID_PREFIX}_${yy}${mm}${dd}_${hex}`;
}

export class DepartmentSpecialtyService {
    /**
     * Lấy danh sách chuyên khoa đã gán cho 1 phòng ban
     */
    static async getSpecialtiesByDepartmentId(departmentId: string): Promise<DepartmentSpecialty[]> {
        const deptExists = await DepartmentSpecialtyRepository.departmentExists(departmentId);
        if (!deptExists) {
            throw DEPARTMENT_SPECIALTY_ERRORS.DEPARTMENT_NOT_FOUND;
        }
        return await DepartmentSpecialtyRepository.getSpecialtiesByDepartmentId(departmentId);
    }

    /**
     * Lấy danh sách chuyên khoa theo chi nhánh
     */
    static async getSpecialtiesByBranchId(branchId: string): Promise<DepartmentSpecialty[]> {
        return await DepartmentSpecialtyRepository.getSpecialtiesByBranchId(branchId);
    }

    /**
     * Lấy danh sách chuyên khoa theo cơ sở
     */
    static async getSpecialtiesByFacilityId(facilityId: string): Promise<DepartmentSpecialty[]> {
        return await DepartmentSpecialtyRepository.getSpecialtiesByFacilityId(facilityId);
    }

    /**
     * Gán danh sách chuyên khoa vào phòng ban (Replace strategy)
     * Xóa toàn bộ mapping cũ → gán mới, đồng bộ với UI checkbox
     */
    static async assignSpecialties(
        departmentId: string,
        specialtyIds: string[]
    ): Promise<{ assigned: number; skipped: number }> {
        const deptExists = await DepartmentSpecialtyRepository.departmentExists(departmentId);
        if (!deptExists) {
            throw DEPARTMENT_SPECIALTY_ERRORS.DEPARTMENT_NOT_FOUND;
        }

        if (!specialtyIds || specialtyIds.length === 0) {
            throw DEPARTMENT_SPECIALTY_ERRORS.SPECIALTY_IDS_REQUIRED;
        }

        /** Xác minh tất cả specialty_ids hợp lệ trước khi gán */
        for (const specialtyId of specialtyIds) {
            const specExists = await DepartmentSpecialtyRepository.specialtyExists(specialtyId);
            if (!specExists) {
                throw { ...DEPARTMENT_SPECIALTY_ERRORS.SPECIALTY_NOT_FOUND, detail: `specialty_id: ${specialtyId}` };
            }
        }

        /** Xóa toàn bộ mapping cũ */
        await DepartmentSpecialtyRepository.removeAllByDepartment(departmentId);

        let assigned = 0;
        let skipped = 0;

        for (const specialtyId of specialtyIds) {
            const id = generateDepartmentSpecialtyId();
            const result = await DepartmentSpecialtyRepository.assign(id, departmentId, specialtyId);
            if (result) {
                assigned++;
            } else {
                skipped++;
            }
        }

        return { assigned, skipped };
    }

    /**
     * Gỡ 1 chuyên khoa khỏi phòng ban
     */
    static async removeSpecialty(departmentId: string, specialtyId: string): Promise<void> {
        const removed = await DepartmentSpecialtyRepository.remove(departmentId, specialtyId);
        if (!removed) {
            throw DEPARTMENT_SPECIALTY_ERRORS.NOT_FOUND;
        }
    }
}
