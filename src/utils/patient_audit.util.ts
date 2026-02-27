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

            const formatValue = (val: any) => {
                if (val === null || val === undefined) return '';
                if (typeof val === 'boolean') return val ? 'true' : 'false';
                if (val instanceof Date) return val.toISOString().split('T')[0];
                return String(val).trim();
            };

            const oldString = formatValue(oldValue);
            const newString = formatValue(newValue);

            if (newString !== oldString) {
                logs.push({
                    log_id: crypto.randomUUID(),
                    patient_id: patientId,
                    changed_by: accountId,
                    field_name: `${prefix}${key}`,
                    old_value: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
                    new_value: newValue !== null && newValue !== undefined ? String(newValue) : null,
                    created_at: new Date()
                });
            }
        }
        return logs;
    }
}