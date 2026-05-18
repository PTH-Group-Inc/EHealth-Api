export type AccountRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT' | 'CUSTOMER' | 'PHARMACIST' | 'STAFF' | 'SYSTEM';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING';

export interface User {
  /** Canonical alias snake_case (#7). */
  user_id?: string;
  /** @deprecated giữ tạm để backward compat (BACKEND_TASKS #7). Dùng `user_id`. */
  users_id: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  roles: string[];
  status: AccountStatus;
  last_login_at: Date | null;
  failed_login_count: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
}