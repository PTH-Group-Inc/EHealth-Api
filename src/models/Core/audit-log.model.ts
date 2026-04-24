export enum AuditActionType {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    EXPORT = 'EXPORT',
    FAILED_ATTEMPT = 'FAILED_ATTEMPT',
    ADMIN_ACTION = 'ADMIN_ACTION',
    PERMISSION_CHANGE = 'PERMISSION_CHANGE',
    ROLE_CHANGE = 'ROLE_CHANGE',
    PASSWORD_RESET = 'PASSWORD_RESET',
    ACCOUNT_LOCK = 'ACCOUNT_LOCK',
    CONFIG_CHANGE = 'CONFIG_CHANGE',
    OTHER = 'OTHER'
}

export interface AuditLog {
    log_id: string;
    user_id?: string;
    action_type: AuditActionType;
    module_name: string;
    target_id?: string;
    old_value?: any;
    new_value?: any;
    ip_address?: string;
    user_agent?: string;
    status_code?: number;
    is_success?: boolean;
    created_at: Date;
}

export interface AuditLogQueryFilters {
    user_id?: string;
    module_name?: string;
    action_type?: string;
    target_id?: string;
    start_date?: string;
    end_date?: string;
    page: number;
    limit: number;
}
