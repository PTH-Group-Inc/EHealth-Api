export interface UserSession {
  id: bigint;
  account_id: string;
  refresh_token: string;
  device_id: string | null;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_used_at: Date;
  expired_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}