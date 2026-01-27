export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string | null;
  description: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by_user_id: string | null;
}
