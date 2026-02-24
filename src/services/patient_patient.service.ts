import { ValidationPatientUtil } from '../utils/patient_validation.util';
import { IdentifierPatientUtil } from '../utils/patient_identifier.util';
import { patientRepository } from '../repository/patient_patient.repository';
import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';
import { PatientModels, Gender, IdentityType, CreatePatientPayload, UpdatePatientAdminPayload } from '../models/patient_patient.models';
import { AuditPatientUtil } from '../utils/patient_audit.util';

export class PatientService {
    /**
     * Nghiệp vụ lấy danh sách bệnh nhân
     */
    async getPatientsListLogic(queryParams: any) {
        // Chuẩn hóa tham số phân trang
        const page = Math.max(1, parseInt(queryParams.page) || 1); 
        
        const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 10)); 
        
        const offset = (page - 1) * limit;

        // Chuẩn hóa các tham số Tìm kiếm & Lọc
        const search = queryParams.search ? String(queryParams.search).trim() : undefined;
        const status = queryParams.status ? String(queryParams.status).trim().toUpperCase() : undefined;
        const gender = queryParams.gender ? String(queryParams.gender).trim().toUpperCase() : undefined;

        // Validate
        if (status && !['ACTIVE', 'INACTIVE', 'DECEASED'].includes(status)) {
            throw {
                httpCode: 400,
                code: 'INVALID_FILTER_STATUS',
                message: 'Giá trị lọc trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE, INACTIVE, DECEASED.'
            };
        }

        if (gender && !['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'].includes(gender)) {
            throw {
                httpCode: 400,
                code: 'INVALID_FILTER_GENDER',
                message: 'Giá trị lọc giới tính không hợp lệ.'
            };
        }

        // Gọi  Repository
        const { items, total } = await patientRepository.getPatientsList({
            limit,
            offset,
            search,
            status,
            gender
        });

        // kết quả trả về
        const totalPages = Math.ceil(total / limit);

        return {
            items: items,
            pagination: {
                total_items: total,
                total_pages: totalPages,
                current_page: page,
                limit: limit
            }
        };
    }



    /*
     * Nghiệp vụ tạo mới hồ sơ bệnh nhân
     */
    async createPatientProfile(payload: CreatePatientPayload, currentUser: { account_id: string; role: string }) {
        // Có loại giấy tờ nhưng không có số giấy tờ -> Báo lỗi
        if (payload.identity_type && !payload.identity_number) {
            throw PATIENT_ERROR_CODES.MISSING_IDENTITY_NUMBER;
        }

        // --- Normalize & Validate ---
        if (!payload.full_name || payload.full_name.trim().length < 2) {
            throw PATIENT_ERROR_CODES.INVALID_NAME;
        }
        const normalizedFullName = ValidationPatientUtil.normalizeFullName(payload.full_name);
        const formattedDateOfBirth = ValidationPatientUtil.parseAndValidateDateOfBirth(payload.date_of_birth);


        // --- Check Duplicate ---
        // Chỉ kiểm tra khi bệnh nhân có cung cấp giấy tờ định danh
        if (payload.identity_type && payload.identity_number) {
            const isExist = await patientRepository.checkPatientExistenceByIdentity(
                payload.identity_type,
                payload.identity_number
            );

            if (isExist) {
                throw PATIENT_ERROR_CODES.DUPLICATE_STRONG;
            }
        }


        // --- Generate IDs ---
        const patientId = IdentifierPatientUtil.generateInternalId();
        const patientCode = IdentifierPatientUtil.generatePatientCode();


        // --- Save (Map data & Insert) ---
        const now = new Date();
        const newPatient: PatientModels = {
            patient_id: patientId,
            patient_code: patientCode,
            full_name: normalizedFullName,
            date_of_birth: formattedDateOfBirth,
            gender: (payload.gender as Gender) || null,
            phone: payload.phone || null,
            identity_type: (payload.identity_type as IdentityType) || null,
            identity_number: payload.identity_number || null,
            status: 'ACTIVE',
            created_at: now,
            updated_at: now,
        };

        // Gọi Repository để lưu xuống DB
        await patientRepository.insertNewPatientWithAuditTransaction(newPatient, currentUser.account_id);


        // --- Return ---
        return {
            patient_id: newPatient.patient_id,
            patient_code: newPatient.patient_code,
            status: newPatient.status,
        };
    }



    /**
     * Cập nhật thông tin hành chính bệnh nhân
     */
    async updatePatientAdminInfo(patientId: string, payload: UpdatePatientAdminPayload, currentUser: { account_id: string; role: string }) {
        // Kiểm tra quyền của user (chỉ ADMIN mới được phép cập nhật thông tin hành chính)
        const forbiddenRoles = ['DOCTOR', 'NURSE'];
        if (forbiddenRoles.includes(currentUser.role)) {
            throw PATIENT_ERROR_CODES.FORBIDDEN;
        }

        // Xử lý dữ liệu đầu vào
        const mappedData: Record<string, any> = {};

        if (payload.full_name !== undefined) mappedData.full_name = ValidationPatientUtil.normalizeString(payload.full_name);
        if (payload.email !== undefined) mappedData.email = ValidationPatientUtil.normalizeString(payload.email);
        if (payload.address !== undefined) mappedData.address = ValidationPatientUtil.normalizeString(payload.address);
        if (payload.identity_number !== undefined) mappedData.identity_number = ValidationPatientUtil.normalizeString(payload.identity_number);
        if (payload.ethnicity !== undefined) mappedData.ethnicity = ValidationPatientUtil.normalizeString(payload.ethnicity);
        if (payload.nationality !== undefined) mappedData.nationality = ValidationPatientUtil.normalizeString(payload.nationality);
        if (payload.job_title !== undefined) mappedData.job_title = ValidationPatientUtil.normalizeString(payload.job_title);
        if (payload.emer_contact_name !== undefined) mappedData.emer_contact_name = ValidationPatientUtil.normalizeString(payload.emer_contact_name);

        if (payload.date_of_birth !== undefined) {
            mappedData.date_of_birth = ValidationPatientUtil.parseAndValidateDateOfBirth(payload.date_of_birth);
        }
        if (payload.phone !== undefined) {
            mappedData.phone = payload.phone ? ValidationPatientUtil.validatePhoneNumber(payload.phone) : null;
        }
        if (payload.emer_contact_phone !== undefined) {
            mappedData.emer_contact_phone = payload.emer_contact_phone ? ValidationPatientUtil.validatePhoneNumber(payload.emer_contact_phone) : null;
        }

        if (payload.gender !== undefined) mappedData.gender = payload.gender;
        if (payload.identity_type !== undefined) mappedData.identity_type = payload.identity_type;
        if (payload.blood_type !== undefined) mappedData.blood_type = payload.blood_type;
        if (payload.account_id !== undefined) mappedData.account_id = payload.account_id;
        if (payload.status !== undefined) mappedData.status = payload.status;

        // Nếu client gọi API nhưng body rỗng
        if (Object.keys(mappedData).length === 0) {
            return { patient_id: patientId, message: 'Không có dữ liệu nào được cập nhật.' };
        }

        //iểm tra bệnh nhân tồn tại
        const oldPatientData = await patientRepository.getPatientById(patientId);
        if (!oldPatientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }

        // Tránh xung đột số điện thoại
        if (mappedData.phone) {
            const isConflict = await patientRepository.checkPhoneConflict(mappedData.phone, patientId);
            if (isConflict) {
                throw PATIENT_ERROR_CODES.CONFLICT_ERR;
            }
        }

        // Tạo log và Gọi Repository để lưu DB
        const auditLogs = AuditPatientUtil.generateLogRecords(
            oldPatientData,
            mappedData,
            currentUser.account_id,
            patientId
        );

        // Chỉ thực hiện update DB nếu thực sự có sự thay đổi dữ liệu
        if (auditLogs.length > 0) {
            await patientRepository.updatePatientWithAuditTransaction(patientId, mappedData, auditLogs);
        }

        return {
            patient_id: patientId,
            updated_at: new Date()
        };
    }



    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE / DECEASED)
     */
    async updatePatientStatusLogic(
        patientId: string, 
        payload: { status: string; status_reason?: string }, 
        currentUser: { account_id: string; role: string }
    ) {
        // Kiểm tra tính hợp lệ cơ bản
        const validStatuses = ['ACTIVE', 'INACTIVE', 'DECEASED'];
        if (!validStatuses.includes(payload.status)) {
            throw {
                httpCode: 400,
                code: 'INVALID_PAYLOAD',
                message: 'Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE, INACTIVE, DECEASED.'
            };
        }

        // Bắt buộc có lý do nếu ngưng theo dõi hoặc báo tử
        if (['INACTIVE', 'DECEASED'].includes(payload.status)) {
            if (!payload.status_reason || payload.status_reason.trim() === '') {
                throw {
                    httpCode: 400,
                    code: 'MISSING_REASON',
                    message: 'Vui lòng nhập lý do khi chuyển trạng thái sang ngưng hoạt động hoặc tử vong.'
                };
            }
        }

        // Kiểm tra hồ sơ tồn tại
        const oldPatientData = await patientRepository.getPatientById(patientId);
        if (!oldPatientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }

        //Kiểm tra luồng logic trạng thái
        // Chặn: Hồ sơ đã tử vong thì vĩnh viễn không được mở lại hay đổi trạng thái khác
        if (oldPatientData.status === 'DECEASED') {
            throw {
                httpCode: 409,
                code: 'DECEASED_LOCKED',
                message: 'Không thể thay đổi trạng thái của hồ sơ bệnh nhân đã báo tử.'
            };
        }

        // Xử lý status_reason: Nếu chuyển về ACTIVE thì tự động dọn dẹp (null) lý do cũ
        let finalReason = payload.status_reason?.trim() || null;
        if (payload.status === 'ACTIVE') {
            finalReason = null;
        }

        // Kiểm tra nếu trạng thái không có sự thay đổi so với dữ liệu cũ thì không cần update, chỉ trả về thông báo
        const oldReason = (oldPatientData as any).status_reason || null;
        if (oldPatientData.status === payload.status && oldReason === finalReason) {
            return { 
                patient_id: patientId, 
                message: 'Trạng thái không có sự thay đổi.' 
            };
        }

        // Kiểm tra ràng buộc chéo - Chỉ check khi chuẩn bị khóa hồ sơ
        if (['INACTIVE', 'DECEASED'].includes(payload.status)) {
            const hasConstraints = await patientRepository.checkBusinessConstraintsForStatusChange(patientId);
            if (hasConstraints) {
                throw {
                    httpCode: 409,
                    code: 'CONSTRAINT_VIOLATION',
                    message: 'Không thể khóa! Hồ sơ đang có lịch hẹn chờ khám hoặc nợ viện phí chưa thanh toán.'
                };
            }
        }

        // Chuẩn bị dữ liệu để sinh Log
        const oldDataToCompare = {
            status: oldPatientData.status,
            status_reason: oldReason
        };

        const newDataToCompare = {
            status: payload.status,
            status_reason: finalReason
        };

        const auditLogs = AuditPatientUtil.generateLogRecords(
            oldDataToCompare,
            newDataToCompare,
            currentUser.account_id,
            patientId
        );

        // Thực thi cập nhật trạng thái cùng với log trong một transaction
        await patientRepository.updatePatientStatusWithAuditTransaction(
            patientId,
            payload.status,
            finalReason,
            auditLogs
        );

        return {
            patient_id: patientId,
            status: payload.status,
            updated_at: new Date()
        };
    }




}

export const patientService = new PatientService();