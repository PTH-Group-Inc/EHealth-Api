export interface AssignUserFacilityInput {
    branchId: string;
    departmentId?: string;
    roleTitle?: string;
}

export interface RemoveUserFacilityInput {
    reason: string;
}


export interface UserFacilityInfo {
    user_branch_dept_id: string;
    branch_id: string;
    branch_code: string;
    branch_name: string;
    facility_id: string;
    facility_code: string;
    facility_name: string;
    department_id: string | null;
    department_code: string | null;
    department_name: string | null;
    role_title: string | null;
    status: string;
}

export interface FacilityDropdown {
    facilities_id: string;
    code: string;
    name: string;
}
