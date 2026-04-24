const ROLE_PRIORITY = ['ADMIN', 'DOCTOR', 'PHARMACIST', 'STAFF', 'PATIENT'] as const;

function getRolePriority(code: string): number {
    const normalizedCode = code.trim().toUpperCase();
    const index = ROLE_PRIORITY.indexOf(normalizedCode as typeof ROLE_PRIORITY[number]);
    return index === -1 ? ROLE_PRIORITY.length + 100 : index;
}

export function compareRoleCodes(left: string, right: string): number {
    const priorityDiff = getRolePriority(left) - getRolePriority(right);
    if (priorityDiff !== 0) return priorityDiff;
    return left.localeCompare(right);
}

export function normalizeRoleCodes(roleCodes: Array<string | null | undefined>): string[] {
    const uniqueCodes = Array.from(
        new Set(
            roleCodes
                .filter((code): code is string => typeof code === 'string' && code.trim().length > 0)
                .map((code) => code.trim().toUpperCase())
        )
    );

    if (uniqueCodes.length === 0) return [];

    uniqueCodes.sort(compareRoleCodes);
    return [uniqueCodes[0]];
}

export function pickPrimaryRoleRow<T extends { code?: string | null }>(roles: T[]): T[] {
    if (!Array.isArray(roles) || roles.length === 0) return [];

    const uniqueRows = Array.from(
        new Map(
            roles
                .filter((role) => typeof role?.code === 'string' && role.code.trim().length > 0)
                .map((role) => [role.code!.trim().toUpperCase(), { ...role, code: role.code!.trim().toUpperCase() }])
        ).values()
    );

    if (uniqueRows.length === 0) return [];

    uniqueRows.sort((left, right) => compareRoleCodes(left.code!, right.code!));
    return [uniqueRows[0]];
}
