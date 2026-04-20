
import { pool, connectDB } from './src/config/postgresdb';
import { AppointmentRepository } from './src/repository/Appointment Management/appointment.repository';

async function run() {
    await connectDB();
    const data = {
        patient_id: '5b9a4af8-99fb-4451-80f9-5d4170b9df19',
        branch_id: 'BR_MAIN',
        appointment_date: '2026-04-21',
        booking_channel: 'PRE_BOOKING',
        doctor_id: 'DOC_02'
    } as any;
    const auditLog = { changed_by: 'test' } as any;

    try {
        console.log('Testing create...');
        const apt = await AppointmentRepository.create(data, auditLog, 'PENDING');
        console.log('Created apt:', apt);
    } catch (e: any) {
        console.log('Error caught:', e.stack || e.message);
    } finally {
        await pool.end();
    }
}
run();

