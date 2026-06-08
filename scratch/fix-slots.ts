import { pool } from '../src/config/postgresdb';

async function fixSlots() {
    try {
        console.log('--- Fixing slot_id for test appointments ---');
        
        const updates = [
            { id: 'APT_DOC_TEST_03', slot: 'SLOT_003' },
            { id: 'APT_DOC_TEST_04', slot: 'SLOT_004' },
            { id: 'APT_DOC_TEST_02', slot: 'SLOT_006' },
            { id: 'APT_DOC_TEST_01', slot: 'SLOT_007' },
            { id: 'APT_EXAM_BILL_TEST_01', slot: 'SLOT_011' },
        ];

        for (const u of updates) {
            const res = await pool.query(
                `UPDATE appointments SET slot_id = $1 WHERE appointments_id = $2 RETURNING appointments_id, slot_id`,
                [u.slot, u.id]
            );
            if (res.rowCount && res.rowCount > 0) {
                console.log(`✅ Updated ${res.rows[0].appointments_id} with slot_id: ${res.rows[0].slot_id}`);
            } else {
                console.log(`⚠️ Appointment ${u.id} not found to update.`);
            }
        }

    } catch (error) {
        console.error('Error during update:', error);
    } finally {
        await pool.end();
    }
}

fixSlots();
