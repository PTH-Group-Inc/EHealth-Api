export type AccountRole = | 'ADMIN' | 'DOCTOR' | 'PHARMACIST' | 'STAFF' | 'CUSTOMER' | 'SYSTEM';

export type AccountStatus = | 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'DELETED';

export interface Account {
  account_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  password: string;
  role: AccountRole;
  status: AccountStatus;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}