import { AccountRole } from '../models/auth_account.model';

export const ROLE_CONFIG: Record<AccountRole, { prefix: string; sequence: string }> = {
    CUSTOMER:   { prefix: 'CUS', sequence: 'accounting.seq_account_customer' },
    DOCTOR:     { prefix: 'DOC', sequence: 'accounting.seq_account_doctor' },
    PHARMACIST: { prefix: 'PHA', sequence: 'accounting.seq_account_pharmacist' },
    STAFF:      { prefix: 'STA', sequence: 'accounting.seq_account_staff' },
    ADMIN:      { prefix: 'ADM', sequence: 'accounting.seq_account_admin' },
    SYSTEM:     { prefix: 'SYS', sequence: 'accounting.seq_account_system' },
};