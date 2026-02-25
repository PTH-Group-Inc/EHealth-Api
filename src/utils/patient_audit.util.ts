import { PatientAuditLogModel } from '../models/patient_patient.models';

export class AuditPatientUtil {
    /**
     * Sinh danh sách log
     */
    static generateLogRecords(oldData: any, newData: any, accountId: string, patientId: string): PatientAuditLogModel[] {
        const logs: PatientAuditLogModel[] = [];

        // Chỉ duyệt qua các key có trong newData
        for (const key of Object.keys(newData)) {
            const newValue = newData[key];
            const oldValue = oldData[key];

            const oldString = oldValue instanceof Date ? oldValue.toISOString().split('T')[0] : String(oldValue || '').trim();
            const newString = String(newValue || '').trim();

            // Bỏ qua nếu giá trị gửi lên là undefined
            if (newString !== oldString) {
                logs.push({
                    patient_id: patientId,
                    changed_by: accountId,
                    field_name: key,
                    old_value: oldValue ? String(oldValue) : null,
                    new_value: newValue ? String(newValue) : null
                });
            }
        }

        return logs;
    }
}