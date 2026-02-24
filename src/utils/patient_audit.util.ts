import { PatientAuditLogModel } from '../models/patient_patient.models';

export class AuditPatientUtil {
    /**
     * Sinh danh sách log
     */
    static generateLogRecords(
        oldData: any, 
        newData: any, 
        accountId: string, 
        patientId: string
    ): PatientAuditLogModel[] {
        const logs: PatientAuditLogModel[] = [];

        // Chỉ duyệt qua các key có trong newData
        for (const key of Object.keys(newData)) {
            const newValue = newData[key];
            const oldValue = oldData[key];

            // Bỏ qua nếu giá trị gửi lên là undefined
            if (newValue !== undefined && newValue !== oldValue) {
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