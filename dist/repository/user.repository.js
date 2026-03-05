"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const postgresdb_1 = require("../config/postgresdb");
const auth_security_util_1 = require("../utils/auth-security.util");
const app_error_util_1 = require("../utils/app-error.util");
class UserRepository {
    /**
     * Tạo tài khoản người dùng mới (dành cho Admin)
     */
    static async createUser(data) {
        // Validate Role (Nằm ngoài Transaction để đỡ lãng phí DB Connection/Rollback)
        let validatedRoles = [];
        if (data.roles && data.roles.length > 0) {
            const placeholders = data.roles.map((_, i) => `$${i + 1}`).join(',');
            const roleResult = await postgresdb_1.pool.query(`SELECT roles_id, code FROM roles WHERE code IN (${placeholders})`, data.roles);
            if (roleResult.rows.length !== data.roles.length) {
                throw new app_error_util_1.AppError(400, 'USER_INVALID_ROLE', 'Một hoặc nhiều vai trò (Role) truyền vào không tồn tại trong hệ thống.');
            }
            validatedRoles = roleResult.rows;
        }
        const client = await postgresdb_1.pool.connect();
        try {
            await client.query('BEGIN');
            // Generate IDs based on actual Main Role
            const primaryRole = (data.roles && data.roles.length > 0) ? data.roles[0] : 'CUSTOMER';
            const userId = await auth_security_util_1.SecurityUtil.generateUsersId(primaryRole);
            const profileId = auth_security_util_1.SecurityUtil.generateUserProfileId(userId);
            // Insert into users
            const passwordHash = data.hashedPassword || '';
            const status = 'ACTIVE';
            await client.query(`
                INSERT INTO users (users_id, email, phone_number, password_hash, status)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, data.email || null, data.phone || null, passwordHash, status]);
            // Insert into user_profiles
            await client.query(`
                INSERT INTO user_profiles (user_profiles_id, user_id, full_name, dob, gender, identity_card_number, address)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                profileId,
                userId,
                data.full_name,
                data.dob || null,
                data.gender || null,
                data.identity_card_number || null,
                data.address || null
            ]);
            // Assign Roles
            if (validatedRoles.length > 0) {
                const values = [];
                const insertPlaceholders = [];
                validatedRoles.forEach((row, index) => {
                    insertPlaceholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                    values.push(userId, row.roles_id);
                });
                await client.query(`
                    INSERT INTO user_roles (user_id, role_id)
                    VALUES ${insertPlaceholders.join(',')}
                `, values);
            }
            await client.query('COMMIT');
            return userId;
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error.code === '23505') {
                const detail = error.detail || '';
                if (detail.includes('email')) {
                    throw new app_error_util_1.AppError(400, 'USER_EMAIL_EXISTED', 'Email đã tồn tại trong hệ thống.');
                }
                if (detail.includes('phone')) {
                    throw new app_error_util_1.AppError(400, 'USER_PHONE_EXISTED', 'Số điện thoại đã tồn tại trong hệ thống.');
                }
            }
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Lấy danh sách người dùng với các bộ lọc phân trang
     */
    static async getUsers(filter) {
        const page = filter.page || 1;
        const limit = filter.limit || 10;
        const offset = (page - 1) * limit;
        let queryParams = [];
        let whereClauses = ['u.deleted_at IS NULL'];
        if (filter.search) {
            queryParams.push(`%${filter.search}%`);
            whereClauses.push(`(u.email ILIKE $${queryParams.length} OR u.phone_number ILIKE $${queryParams.length} OR up.full_name ILIKE $${queryParams.length})`);
        }
        if (filter.status) {
            queryParams.push(filter.status);
            whereClauses.push(`u.status = $${queryParams.length}`);
        }
        if (filter.role) {
            queryParams.push(filter.role);
            whereClauses.push(`$${queryParams.length} = ANY(ARRAY(SELECT r2.code FROM user_roles ur2 JOIN roles r2 ON ur2.role_id = r2.roles_id WHERE ur2.user_id = u.users_id))`);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // Get total count
        const countQuery = `
            SELECT COUNT(u.users_id) as total
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            ${whereString}
        `;
        const countResult = await postgresdb_1.pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);
        // Get data
        queryParams.push(limit);
        const limitParamIdx = queryParams.length;
        queryParams.push(offset);
        const offsetParamIdx = queryParams.length;
        const dataQuery = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number AS phone, 
                u.status, 
                u.last_login_at, 
                u.failed_login_count, 
                u.locked_until, 
                u.created_at, 
                u.updated_at,
                COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                up.user_profiles_id,
                up.full_name,
                up.dob,
                up.gender,
                up.identity_card_number,
                up.avatar_url,
                up.address
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            ${whereString}
            GROUP BY u.users_id, up.user_profiles_id
            ORDER BY u.created_at DESC
            LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
        `;
        const result = await postgresdb_1.pool.query(dataQuery, queryParams);
        const items = result.rows.map(row => ({
            users_id: row.users_id,
            email: row.email,
            phone: row.phone,
            roles: row.roles,
            status: row.status,
            last_login_at: row.last_login_at,
            failed_login_count: row.failed_login_count,
            locked_until: row.locked_until,
            created_at: row.created_at,
            updated_at: row.updated_at,
            profile: {
                user_profiles_id: row.user_profiles_id,
                full_name: row.full_name,
                dob: row.dob,
                gender: row.gender,
                identity_card_number: row.identity_card_number,
                avatar_url: row.avatar_url,
                address: row.address
            }
        }));
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
     * Lấy chi tiết user bằng ID
     */
    static async getUserById(userId) {
        const query = `
            SELECT 
                u.users_id, 
                u.email, 
                u.phone_number AS phone, 
                u.status, 
                u.last_login_at, 
                u.failed_login_count, 
                u.locked_until, 
                u.created_at, 
                u.updated_at,
                COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                up.user_profiles_id,
                up.full_name,
                up.dob,
                up.gender,
                up.identity_card_number,
                up.avatar_url,
                up.address
            FROM users u
            LEFT JOIN user_profiles up ON u.users_id = up.user_id
            LEFT JOIN user_roles ur ON u.users_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.roles_id
            WHERE u.users_id = $1 AND u.deleted_at IS NULL
            GROUP BY u.users_id, up.user_profiles_id
        `;
        const result = await postgresdb_1.pool.query(query, [userId]);
        if (result.rowCount === 0)
            return null;
        const row = result.rows[0];
        return {
            users_id: row.users_id,
            email: row.email,
            phone: row.phone,
            roles: row.roles,
            status: row.status,
            last_login_at: row.last_login_at,
            failed_login_count: row.failed_login_count,
            locked_until: row.locked_until,
            created_at: row.created_at,
            updated_at: row.updated_at,
            profile: {
                user_profiles_id: row.user_profiles_id,
                full_name: row.full_name,
                dob: row.dob,
                gender: row.gender,
                identity_card_number: row.identity_card_number,
                avatar_url: row.avatar_url,
                address: row.address
            }
        };
    }
    /**
     * Cập nhật thông tin profile của User (Bởi admin)
     */
    static async updateUser(userId, data) {
        // Validate Role tồn tại bên ngoài Transaction
        let validRolesData = [];
        if (data.roles && data.roles.length > 0) {
            const placeholders = data.roles.map((_, i) => `$${i + 1}`).join(',');
            const roleResult = await postgresdb_1.pool.query(`SELECT roles_id, code FROM roles WHERE code IN (${placeholders})`, data.roles);
            if (roleResult.rows.length !== data.roles.length) {
                throw new app_error_util_1.AppError(400, 'USER_INVALID_ROLE', 'Một hoặc nhiều vai trò (Role) bổ sung không tồn tại trong hệ thống.');
            }
            validRolesData = roleResult.rows;
        }
        const client = await postgresdb_1.pool.connect();
        try {
            await client.query('BEGIN');
            // Update Users Table
            const userFields = [];
            const userValues = [];
            let userParamIdx = 1;
            if (data.email !== undefined) {
                userFields.push(`email = $${userParamIdx++}`);
                userValues.push(data.email);
            }
            if (data.phone !== undefined) {
                userFields.push(`phone_number = $${userParamIdx++}`);
                userValues.push(data.phone);
            }
            if (data.status !== undefined) {
                userFields.push(`status = $${userParamIdx++}`);
                userValues.push(data.status);
            }
            if (userFields.length > 0) {
                userFields.push(`updated_at = CURRENT_TIMESTAMP`);
                userValues.push(userId);
                await client.query(`
                    UPDATE users 
                    SET ${userFields.join(', ')} 
                    WHERE users_id = $${userParamIdx}
                `, userValues);
            }
            // Update User Profiles Table
            const profileFields = [];
            const profileValues = [];
            let profileParamIdx = 1;
            if (data.full_name !== undefined) {
                profileFields.push(`full_name = $${profileParamIdx++}`);
                profileValues.push(data.full_name);
            }
            if (data.dob !== undefined) {
                profileFields.push(`dob = $${profileParamIdx++}`);
                profileValues.push(data.dob);
            }
            if (data.gender !== undefined) {
                profileFields.push(`gender = $${profileParamIdx++}`);
                profileValues.push(data.gender);
            }
            if (data.identity_card_number !== undefined) {
                profileFields.push(`identity_card_number = $${profileParamIdx++}`);
                profileValues.push(data.identity_card_number);
            }
            if (data.avatar_url !== undefined) {
                profileFields.push(`avatar_url = $${profileParamIdx++}`);
                profileValues.push(data.avatar_url);
            }
            if (data.address !== undefined) {
                profileFields.push(`address = $${profileParamIdx++}`);
                profileValues.push(data.address);
            }
            if (profileFields.length > 0) {
                profileValues.push(userId);
                await client.query(`
                    UPDATE user_profiles 
                    SET ${profileFields.join(', ')} 
                    WHERE user_id = $${profileParamIdx}
                `, profileValues);
            }
            // Update User Roles 
            if (data.roles !== undefined) {
                // Lấy mảng role hiện tại
                const currentRolesResult = await client.query(`
                    SELECT r.code, ur.role_id 
                    FROM user_roles ur 
                    JOIN roles r ON ur.role_id = r.roles_id 
                    WHERE ur.user_id = $1
                `, [userId]);
                const currentRoleCodes = currentRolesResult.rows.map(r => r.code);
                // Tìm role cần thêm và role cần xóa
                const rolesToAdd = data.roles.filter(role => !currentRoleCodes.includes(role));
                const rolesToRemove = currentRoleCodes.filter(role => !data.roles.includes(role));
                // Xóa các role không còn nằm trong mảng mới
                if (rolesToRemove.length > 0) {
                    const removePlaceholders = rolesToRemove.map((_, i) => `$${i + 2}`).join(',');
                    await client.query(`
                        DELETE FROM user_roles 
                        WHERE user_id = $1 
                        AND role_id IN (SELECT roles_id FROM roles WHERE code IN (${removePlaceholders}))
                    `, [userId, ...rolesToRemove]);
                }
                // Thêm các role mới
                if (rolesToAdd.length > 0) {
                    // Lọc ra các ID của rolesToAdd từ validRolesData đã query ở ngoài transaction
                    const roleToAddResultRows = validRolesData.filter(r => rolesToAdd.includes(r.code));
                    if (roleToAddResultRows.length > 0) {
                        const values = [];
                        const insertPlaceholders = [];
                        roleToAddResultRows.forEach((row, index) => {
                            insertPlaceholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                            values.push(userId, row.roles_id);
                        });
                        await client.query(`
                            INSERT INTO user_roles (user_id, role_id)
                            VALUES ${insertPlaceholders.join(',')}
                        `, values);
                    }
                }
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error.code === '23505') {
                const detail = error.detail || '';
                if (detail.includes('email')) {
                    throw new app_error_util_1.AppError(400, 'USER_EMAIL_EXISTED', 'Email đã tồn tại trong hệ thống.');
                }
                if (detail.includes('phone')) {
                    throw new app_error_util_1.AppError(400, 'USER_PHONE_EXISTED', 'Số điện thoại đã tồn tại trong hệ thống.');
                }
            }
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Soft delete user
     */
    static async deleteUser(userId) {
        const query = `
            UPDATE users
            SET deleted_at = CURRENT_TIMESTAMP, 
                status = 'INACTIVE',
                updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $1 AND deleted_at IS NULL
        `;
        const result = await postgresdb_1.pool.query(query, [userId]);
        return (result.rowCount ?? 0) > 0;
    }
    /**
     * Khóa tài khoản (Cập nhật status = BANNED)
     */
    static async lockUser(userId) {
        const query = `
            UPDATE users
            SET status = 'BANNED', updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $1 AND deleted_at IS NULL
        `;
        const result = await postgresdb_1.pool.query(query, [userId]);
        return (result.rowCount ?? 0) > 0;
    }
    /**
     * Mở khóa tài khoản (Cập nhật status = ACTIVE, xóa thông tin khóa tự động do dăng nhập sai)
     */
    static async unlockUser(userId) {
        const query = `
            UPDATE users
            SET status = 'ACTIVE', 
                failed_login_count = 0, 
                locked_until = NULL, 
                updated_at = CURRENT_TIMESTAMP
            WHERE users_id = $1 AND deleted_at IS NULL
        `;
        const result = await postgresdb_1.pool.query(query, [userId]);
        return (result.rowCount ?? 0) > 0;
    }
}
exports.UserRepository = UserRepository;
