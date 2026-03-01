import { PatientAuditLogModel } from '../models/patient_patient.models';
import crypto from 'crypto';

export class AuditPatientUtil {
    /**
     * Sinh danh sách log
     */
    static generateLogRecords(
        oldData: any, 
        newData: any, 
        accountId: string, 
        patientId: string,
        prefix: string = '' 
    ): PatientAuditLogModel[] {
        const logs: PatientAuditLogModel[] = [];

        for (const key of Object.keys(newData)) {
            const newValue = newData[key];
            const oldValue = oldData[key];

            // Chuẩn hóa để so sánh
            const formatValue = (val: any) => {
                if (val === null || val === undefined) return '';
                if (typeof val === 'boolean') return val ? 'true' : 'false';
                if (val instanceof Date) return val.toISOString().split('T')[0];
                return String(val).trim();
            };

            const oldString = formatValue(oldValue);
            const newString = formatValue(newValue);

            // Chỉ sinh log nếu thực sự có sự khác biệt
            if (newString !== oldString) {
                logs.push({
                    log_id: crypto.randomUUID(),
                    patient_id: patientId,
                    changed_by: accountId,
                    field_name: `${prefix}${key}`,
                    
                    old_value: oldString === '' ? null : oldString,
                    new_value: newString === '' ? null : newString,
                    created_at: new Date()
                });
            }
        }
        return logs;
    }
}