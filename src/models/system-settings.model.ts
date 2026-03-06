/** Cấu hình giờ làm việc của 1 ngày trong tuần */
export interface WorkingHoursDay {
    operation_hours_id?: string;
    day_of_week: number;
    day_label: string;
    open_time: string;
    close_time: string;
    is_closed: boolean;
}

/** Toàn bộ cấu hình giờ làm việc 7 ngày trong tuần */
export type WorkingHoursConfig = WorkingHoursDay[];

/** Input để cập nhật giờ làm việc (gửi những ngày cần thay đổi) */
export interface UpdateWorkingHoursInput {
    days: Array<{
        day_of_week: number;
        open_time?: string;
        close_time?: string;
        is_closed?: boolean;
    }>;
}

/** Cấu hình slot khám bệnh */
export interface SlotConfig {
    duration_minutes: number;
    max_patients_per_slot: number;
}

/** Input cập nhật slot config */
export interface UpdateSlotConfigInput {
    duration_minutes?: number;
    max_patients_per_slot?: number;
}

// BUSINESS RULES

/** 1 quy định nghiệp vụ */
export interface BusinessRule {
    system_settings_id: string;
    setting_key: string;
    value: number | boolean;
    module: string;
    description: string | null;
    updated_by: string | null;
    updated_at: Date;
}

/** Response trả về theo nhóm module */
export interface BusinessRulesGrouped {
    module: string;
    rules: BusinessRule[];
}

/** Input PUT single rule */
export interface UpdateBusinessRuleInput {
    value: number | boolean;
}

/** Input PUT bulk */
export interface BulkUpdateBusinessRulesInput {
    rules: Array<{
        key: string;
        value: number | boolean;
    }>;
}

// SECURITY SETTINGS (1.4.4)
/** Cấu hình bảo mật hệ thống – structured object */
export interface SecurityConfig {
    max_login_attempts: number;
    lock_duration_minutes: number;
    require_email_verification: boolean;
    password_min_length: number;
    session_duration_days: number;
    require_2fa_roles: string[];
    access_token_expiry_minutes: number;
    refresh_token_expiry_days: number;
}

/** Input cập nhật – tất cả optional (partial update) */
export interface UpdateSecurityConfigInput {
    max_login_attempts?: number;
    lock_duration_minutes?: number;
    require_email_verification?: boolean;
    password_min_length?: number;
    session_duration_days?: number;
    require_2fa_roles?: string[];
    access_token_expiry_minutes?: number;
    refresh_token_expiry_days?: number;
}
