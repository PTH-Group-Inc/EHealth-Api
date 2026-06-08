import { pool } from '../src/config/postgresdb';

const openShiftsForAllStaff = async () => {
    try {
        console.log("Finding all STAFF and ADMIN users to open cashier shifts...");

        // 1. Lấy danh sách STAFF và ADMIN users cùng với full_name của họ
        const queryStaff = `
            SELECT u.users_id, up.full_name, r.code as role_code
            FROM users u
            JOIN user_profiles up ON u.users_id = up.user_id
            JOIN user_roles ur ON u.users_id = ur.user_id
            JOIN roles r ON ur.role_id = r.roles_id
            WHERE r.code IN ('STAFF', 'ADMIN')
        `;
        const staffRes = await pool.query(queryStaff);
        
        if (staffRes.rows.length === 0) {
            console.error("No STAFF or ADMIN users found!");
            return;
        }

        console.log(`Found ${staffRes.rows.length} staff/admin users.`);

        // 2. Lấy branch_id và facility_id mặc định
        const branchRes = await pool.query("SELECT branches_id, facility_id FROM branches LIMIT 1");
        let branchId = null;
        let facilityId = null;
        if (branchRes.rows.length > 0) {
            branchId = branchRes.rows[0].branches_id;
            facilityId = branchRes.rows[0].facility_id;
        } else {
            const facRes = await pool.query("SELECT facilities_id FROM facilities LIMIT 1");
            if (facRes.rows.length > 0) {
                facilityId = facRes.rows[0].facilities_id;
            }
        }

        console.log(`Using default Branch ID: ${branchId}, Facility ID: ${facilityId}`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const user of staffRes.rows) {
            // Kiểm tra xem đã có ca OPEN chưa
            const openShiftRes = await pool.query(
                "SELECT cashier_shifts_id FROM cashier_shifts WHERE cashier_id = $1 AND status = 'OPEN'",
                [user.users_id]
            );

            if (openShiftRes.rows.length > 0) {
                console.log(`User ${user.full_name} (${user.role_code}) already has an OPEN shift: ${openShiftRes.rows[0].cashier_shifts_id}. Skipping.`);
                skippedCount++;
                continue;
            }

            const newShiftId = `CSH_${Math.random().toString(36).substring(2, 15)}`;
            
            // Chèn ca OPEN (bỏ cột cashier_name đi vì không có trong DB)
            const insertQuery = `
                INSERT INTO cashier_shifts (
                    cashier_shifts_id, cashier_id, shift_start, opening_balance, 
                    system_calculated_balance, status, branch_id, facility_id, notes
                ) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, 'OPEN', $5, $6, $7)
                RETURNING *
            `;
            const result = await pool.query(insertQuery, [
                newShiftId,
                user.users_id,
                1000000, // opening_balance: 1,000,000đ
                0,
                branchId,
                facilityId,
                `Auto-opened cashier shift for ${user.full_name}`
            ]);

            console.log(`Created open cashier shift for ${user.full_name} (${user.role_code}) - Shift ID: ${newShiftId}`);
            createdCount++;
        }

        console.log(`Finished! Created: ${createdCount}, Skipped: ${skippedCount}`);
    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        await pool.end();
    }
};

openShiftsForAllStaff();
