import { pool } from '../config/postgresdb';
import { WorkingHoursDay, UpdateWorkingHoursInput, SlotConfig, UpdateSlotConfigInput, BusinessRule, SecurityConfig, UpdateSecurityConfigInput, } from '../models/system-settings.model';
import { SLOT_CONFIG_KEYS, DEFAULT_SLOT_CONFIG, DAY_OF_WEEK_LABELS, SECURITY_SETTING_KEYS, DEFAULT_SECURITY_CONFIG, } from '../constants/system.constant';

export class SystemSettingsRepository {
    /**
     * Lấy cấu hình giờ làm việc 7 ngày của facility.
     */
    static async getWorkingHours(facilityId: string): Promise<WorkingHoursDay[]> {
        const query = `
            SELECT
                operation_hours_id,
                day_of_week,
                TO_CHAR(open_time,  'HH24:MI') AS open_time,
                TO_CHAR(close_time, 'HH24:MI') AS close_time,
                is_closed
            FROM facility_operation_hours
            WHERE facility_id = $1
            ORDER BY day_of_week ASC
        `;
        const result = await pool.query(query, [facilityId]);

        return result.rows.map((row: any) => ({
            ...row,
            day_label: DAY_OF_WEEK_LABELS[row.day_of_week] ?? `Ngày ${row.day_of_week}`,
        }));
    }

    /**
     * UPSERT cấu hình giờ làm việc.
     */
    static async upsertWorkingHours(
        facilityId: string,
        days: UpdateWorkingHoursInput['days'],
        operationHoursIdGen: (index: number) => string,
    ): Promise<void> {
        for (const day of days) {
            const id = operationHoursIdGen(day.day_of_week);
            const query = `
                INSERT INTO facility_operation_hours
                    (operation_hours_id, facility_id, day_of_week, open_time, close_time, is_closed)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (facility_id, day_of_week)
                DO UPDATE SET
                    open_time  = COALESCE(EXCLUDED.open_time,  facility_operation_hours.open_time),
                    close_time = COALESCE(EXCLUDED.close_time, facility_operation_hours.close_time),
                    is_closed  = COALESCE(EXCLUDED.is_closed,  facility_operation_hours.is_closed)
            `;
            await pool.query(query, [
                id,
                facilityId,
                day.day_of_week,
                day.open_time ?? '08:00',
                day.close_time ?? '17:00',
                day.is_closed ?? false,
            ]);
        }
    }

    /**
     * Lấy cấu hình slot từ system_settings.
     */
    static async getSlotConfig(): Promise<SlotConfig> {
        const query = `
            SELECT setting_key, setting_value
            FROM system_settings
            WHERE setting_key = ANY($1::text[])
        `;
        const keys = [SLOT_CONFIG_KEYS.DURATION_MINUTES, SLOT_CONFIG_KEYS.MAX_PATIENTS];
        const result = await pool.query(query, [keys]);

        const map: Record<string, any> = {};
        result.rows.forEach((row: any) => {
            map[row.setting_key] = row.setting_value;
        });

        return {
            duration_minutes: map[SLOT_CONFIG_KEYS.DURATION_MINUTES]?.value
                ?? DEFAULT_SLOT_CONFIG.duration_minutes,
            max_patients_per_slot: map[SLOT_CONFIG_KEYS.MAX_PATIENTS]?.value
                ?? DEFAULT_SLOT_CONFIG.max_patients_per_slot,
        };
    }

    /**
     * UPSERT cấu hình slot vào system_settings.
     */
    static async upsertSlotConfig(
        config: UpdateSlotConfigInput,
        updatedBy: string,
        idGen: (key: string) => string,
    ): Promise<void> {
        const upsertQuery = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, description, updated_by, updated_at)
            VALUES ($1, $2, $3::json, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
        `;

        if (config.duration_minutes !== undefined) {
            await pool.query(upsertQuery, [
                idGen(SLOT_CONFIG_KEYS.DURATION_MINUTES),
                SLOT_CONFIG_KEYS.DURATION_MINUTES,
                JSON.stringify({ value: config.duration_minutes }),
                'Thời lượng 1 slot khám bệnh (phút)',
                updatedBy,
            ]);
        }

        if (config.max_patients_per_slot !== undefined) {
            await pool.query(upsertQuery, [
                idGen(SLOT_CONFIG_KEYS.MAX_PATIENTS),
                SLOT_CONFIG_KEYS.MAX_PATIENTS,
                JSON.stringify({ value: config.max_patients_per_slot }),
                'Số bệnh nhân tối đa mỗi slot',
                updatedBy,
            ]);
        }
    }

    // BUSINESS RULES

    /**
     * Lấy tất cả business rules từ system_settings.
     */
    static async getAllBusinessRules(module?: string): Promise<BusinessRule[]> {
        const query = `
            SELECT system_settings_id, setting_key, setting_value,
                   module, description, updated_by, updated_at
            FROM system_settings
            WHERE module IS NOT NULL AND module != 'GENERAL'
              AND ($1::text IS NULL OR module = $1)
            ORDER BY module ASC, setting_key ASC
        `;
        const result = await pool.query(query, [module ?? null]);

        return result.rows.map((row: any) => ({
            system_settings_id: row.system_settings_id,
            setting_key: row.setting_key,
            value: row.setting_value?.value,
            module: row.module,
            description: row.description,
            updated_by: row.updated_by,
            updated_at: row.updated_at,
        }));
    }

    /**
     * Lấy 1 business rule theo setting_key.
     */
    static async getBusinessRuleByKey(key: string): Promise<BusinessRule | null> {
        const query = `
            SELECT system_settings_id, setting_key, setting_value,
                   module, description, updated_by, updated_at
            FROM system_settings
            WHERE setting_key = $1
              AND module IS NOT NULL AND module != 'GENERAL'
        `;
        const result = await pool.query(query, [key]);
        if (!result.rows[0]) return null;

        const row = result.rows[0];
        return {
            system_settings_id: row.system_settings_id,
            setting_key: row.setting_key,
            value: row.setting_value?.value,
            module: row.module,
            description: row.description,
            updated_by: row.updated_by,
            updated_at: row.updated_at,
        };
    }

    /**
     * UPSERT 1 business rule theo setting_key.
     */
    static async upsertBusinessRule(
        key: string,
        value: number | boolean,
        updatedBy: string,
    ): Promise<BusinessRule> {
        const id = `SS_BR_${key.substring(0, 10)}`.replace(/\s/g, '_');
        const query = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, updated_by, updated_at)
            VALUES ($1, $2, $3::json, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
            RETURNING system_settings_id, setting_key, setting_value,
                      module, description, updated_by, updated_at
        `;
        const result = await pool.query(query, [
            id,
            key,
            JSON.stringify({ value }),
            updatedBy,
        ]);

        const row = result.rows[0];
        return {
            system_settings_id: row.system_settings_id,
            setting_key: row.setting_key,
            value: row.setting_value?.value,
            module: row.module,
            description: row.description,
            updated_by: row.updated_by,
            updated_at: row.updated_at,
        };
    }

    /**
     * Bulk UPSERT nhiều business rules trong 1 transaction.
     */
    static async bulkUpsertBusinessRules(
        rules: Array<{ key: string; value: number | boolean }>,
        updatedBy: string,
    ): Promise<BusinessRule[]> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results: BusinessRule[] = [];
            for (const { key, value } of rules) {
                const id = `SS_BR_${key.substring(0, 10)}`.replace(/\s/g, '_');
                const query = `
                    INSERT INTO system_settings
                        (system_settings_id, setting_key, setting_value, updated_by, updated_at)
                    VALUES ($1, $2, $3::json, $4, CURRENT_TIMESTAMP)
                    ON CONFLICT (setting_key)
                    DO UPDATE SET
                        setting_value = EXCLUDED.setting_value,
                        updated_by    = EXCLUDED.updated_by,
                        updated_at    = CURRENT_TIMESTAMP
                    RETURNING system_settings_id, setting_key, setting_value,
                              module, description, updated_by, updated_at
                `;
                const res = await client.query(query, [
                    id,
                    key,
                    JSON.stringify({ value }),
                    updatedBy,
                ]);
                const row = res.rows[0];
                results.push({
                    system_settings_id: row.system_settings_id,
                    setting_key: row.setting_key,
                    value: row.setting_value?.value,
                    module: row.module,
                    description: row.description,
                    updated_by: row.updated_by,
                    updated_at: row.updated_at,
                });
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ============================================================
    // SECURITY SETTINGS (1.4.4)
    // ============================================================

    /**
     * Đọc 8 security setting keys từ DB và map thành SecurityConfig.
     * Fallback về DEFAULT_SECURITY_CONFIG nếu key chưa tồn tại.
     */
    static async getSecurityConfig(): Promise<SecurityConfig> {
        const allKeys = Object.values(SECURITY_SETTING_KEYS);
        const query = `
            SELECT setting_key, setting_value
            FROM system_settings
            WHERE setting_key = ANY($1::text[])
        `;
        const result = await pool.query(query, [allKeys]);

        const map: Record<string, any> = {};
        result.rows.forEach((row: any) => {
            map[row.setting_key] = row.setting_value;
        });

        const def = DEFAULT_SECURITY_CONFIG;
        return {
            max_login_attempts: map[SECURITY_SETTING_KEYS.MAX_LOGIN_ATTEMPTS]?.value ?? def.max_login_attempts,
            lock_duration_minutes: map[SECURITY_SETTING_KEYS.LOCK_ACCOUNT_DURATION_MINUTES]?.value ?? def.lock_duration_minutes,
            require_email_verification: map[SECURITY_SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION]?.value ?? def.require_email_verification,
            password_min_length: map[SECURITY_SETTING_KEYS.PASSWORD_MIN_LENGTH]?.value ?? def.password_min_length,
            session_duration_days: map[SECURITY_SETTING_KEYS.SESSION_DURATION_DAYS]?.value ?? def.session_duration_days,
            // REQUIRE_2FA_ROLES lưu dạng JSON array: {"value": ["ADMIN", ...]}
            require_2fa_roles: Array.isArray(map[SECURITY_SETTING_KEYS.REQUIRE_2FA_ROLES]?.value)
                ? map[SECURITY_SETTING_KEYS.REQUIRE_2FA_ROLES].value
                : [...def.require_2fa_roles],
            access_token_expiry_minutes: map[SECURITY_SETTING_KEYS.ACCESS_TOKEN_EXPIRY_MINUTES]?.value ?? def.access_token_expiry_minutes,
            refresh_token_expiry_days: map[SECURITY_SETTING_KEYS.REFRESH_TOKEN_EXPIRY_DAYS]?.value ?? def.refresh_token_expiry_days,
        };
    }

    /**
     * Partial UPSERT từng security setting key được truyền vào.
     * Mỗi field map sang setting_key tương ứng.
     */
    static async upsertSecurityConfig(
        config: UpdateSecurityConfigInput,
        updatedBy: string,
    ): Promise<void> {
        const upsertQuery = `
            INSERT INTO system_settings
                (system_settings_id, setting_key, setting_value, module, updated_by, updated_at)
            VALUES ($1, $2, $3::json, 'SECURITY', $4, CURRENT_TIMESTAMP)
            ON CONFLICT (setting_key)
            DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = CURRENT_TIMESTAMP
        `;

        // Map từ UpdateSecurityConfigInput field → setting_key
        const fieldKeyMap: Array<[keyof UpdateSecurityConfigInput, string]> = [
            ['max_login_attempts', SECURITY_SETTING_KEYS.MAX_LOGIN_ATTEMPTS],
            ['lock_duration_minutes', SECURITY_SETTING_KEYS.LOCK_ACCOUNT_DURATION_MINUTES],
            ['require_email_verification', SECURITY_SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION],
            ['password_min_length', SECURITY_SETTING_KEYS.PASSWORD_MIN_LENGTH],
            ['session_duration_days', SECURITY_SETTING_KEYS.SESSION_DURATION_DAYS],
            ['require_2fa_roles', SECURITY_SETTING_KEYS.REQUIRE_2FA_ROLES],
            ['access_token_expiry_minutes', SECURITY_SETTING_KEYS.ACCESS_TOKEN_EXPIRY_MINUTES],
            ['refresh_token_expiry_days', SECURITY_SETTING_KEYS.REFRESH_TOKEN_EXPIRY_DAYS],
        ];

        for (const [field, key] of fieldKeyMap) {
            if (config[field] !== undefined) {
                const id = `SS_SEC_${key.replace(/_/g, '').substring(0, 12)}`;
                await pool.query(upsertQuery, [
                    id,
                    key,
                    JSON.stringify({ value: config[field] }),
                    updatedBy,
                ]);
            }
        }
    }
}
