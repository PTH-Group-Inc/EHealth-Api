import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/postgresdb';
import { AuthenticatedRequest } from './authorizeRoles.middleware';

/**
 * Middleware kiểm tra quyền truy cập dữ liệu EHR của bệnh nhân.
 * - Cho phép nếu user có role ADMIN.
 * - Cho phép nếu user là chính bệnh nhân đó (patientId).
 * - Cho phép nếu user là Bác sĩ đã hoặc đang có cuộc hẹn/phiên khám với bệnh nhân này.
 */
export const checkEHRAuthorization = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const auth = req.auth;
        if (!auth) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
        if (!patientId) {
            // Nếu không có patientId để kiểm tra, coi như bad request hoặc bypass tùy context.
            // Trong context các api vital signs thì param là patientId
            return res.status(400).json({ success: false, message: 'Thiếu patientId để kiểm tra quyền truy cập.' });
        }

        // 1. Cho phép ADMIN
        if (auth.roles && auth.roles.includes('ADMIN')) {
            return next();
        }

        // 2. Cho phép chính bệnh nhân đó 
        // Giả sử user account của bệnh nhân lưu patientId trong auth hoặc user_id match
        // Note: hiện tại account_id trong patients có thể match với user_id
        if (auth.user_id === patientId) {
            return next();
        }
        
        const checkPatientAccountQuery = await pool.query(
            `SELECT 1 FROM patients WHERE id = $1 AND account_id = $2 LIMIT 1`,
            [patientId, auth.user_id]
        );
        if (checkPatientAccountQuery.rows.length > 0) {
            return next();
        }

        // 3. Kiểm tra xem user có phải là bác sĩ của bệnh nhân này không
        const checkDoctorQuery = `
            SELECT 1 
            FROM doctors d
            WHERE d.user_id = $1 
            AND EXISTS (
                SELECT 1 FROM appointments a WHERE a.doctor_id = d.doctors_id AND a.patient_id = $2
                UNION
                SELECT 1 FROM encounters e WHERE e.doctor_id = d.doctors_id AND e.patient_id = $2
            )
            LIMIT 1;
        `;
        const { rows } = await pool.query(checkDoctorQuery, [auth.user_id, patientId]);

        if (rows.length > 0) {
            return next(); // Bác sĩ có quyền
        }

        // Nếu không thuộc các trường hợp trên -> 403
        return res.status(403).json({
            success: false,
            message: 'Forbidden - Bạn không có quyền truy cập dữ liệu sức khỏe của bệnh nhân này.',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi kiểm tra quyền truy cập EHR.',
        });
    }
};
