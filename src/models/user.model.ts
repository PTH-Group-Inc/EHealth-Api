export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "DELETED";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  full_name: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by_user_id: string | null;
}
