import { ValidationPatientUtil } from '../utils/patient_validation.util';
import { IdentifierPatientUtil } from '../utils/patient_identifier.util';
import { patientRepository } from '../repository/patient_patient.repository';
import { PATIENT_ERROR_CODES } from '../constants/patient_error.constant';
import { PatientContact, PatientModels, Gender, IdentityType, CreatePatientPayload, UpdatePatientAdminPayload, LinkPatientPayload } from '../models/patient_patient.models';
import { AuditPatientUtil } from '../utils/patient_audit.util';

export class PatientService {
    /**
     * Nghiệp vụ lấy danh sách bệnh nhân
     */
    async getPatientsListLogic(queryParams: any) {
        // Chuẩn hóa
        const page = Math.max(1, parseInt(queryParams.page) || 1);

        const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 10));

        const offset = (page - 1) * limit;

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

        if (!payload.contact || !payload.contact.phone_number || payload.contact.phone_number.trim() === '') {
            throw {
                httpCode: 400,
                code: 'MISSING_PHONE_NUMBER',
                message: 'Bắt buộc phải cung cấp số điện thoại liên lạc của bệnh nhân.'
            };
        }

        if (payload.identity_type && !payload.identity_number) {
            throw PATIENT_ERROR_CODES.MISSING_IDENTITY_NUMBER;
        }

        if (!payload.full_name || payload.full_name.trim().length < 2) {
            throw PATIENT_ERROR_CODES.INVALID_NAME;
        }

        const normalizedFullName = ValidationPatientUtil.normalizeFullName(payload.full_name);
        const formattedDateOfBirth = ValidationPatientUtil.parseAndValidateDateOfBirth(payload.date_of_birth);
        const normalizedPhone = ValidationPatientUtil.validatePhoneNumber(payload.contact.phone_number);

        // Check Duplicate
        if (payload.identity_type && payload.identity_number) {
            const isExist = await patientRepository.checkPatientExistenceByIdentity(
                payload.identity_type, payload.identity_number
            );
            if (isExist) throw PATIENT_ERROR_CODES.DUPLICATE_STRONG;
        }

        const patientId = IdentifierPatientUtil.generateInternalId();
        const patientCode = IdentifierPatientUtil.generatePatientCode();
        const now = new Date();

        const newPatient: PatientModels = {
            patient_id: patientId,
            patient_code: patientCode,
            full_name: normalizedFullName,
            date_of_birth: formattedDateOfBirth,
            gender: (payload.gender as Gender) || null,
            identity_type: (payload.identity_type as IdentityType) || null,
            identity_number: payload.identity_number || null,
            nationality: payload.nationality || 'VN', 
            account_id: null,
            status: 'ACTIVE',
            status_reason: null,
            created_at: now,
            updated_at: now,
        };

        // Tạo object Contact
        const newContact: Omit<PatientContact, 'patient_id' | 'is_primary' | 'created_at' | 'updated_at'> = {
            contact_id: IdentifierPatientUtil.generateInternalId(),
            phone_number: normalizedPhone,
            email: payload.contact.email,
            street_address: payload.contact.street_address,
            ward: payload.contact.ward,
            province: payload.contact.province,
        };

        // Gọi DB (Transaction đã lo phần còn lại)
        await patientRepository.insertNewPatient(newPatient, newContact, currentUser.account_id);

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
        // Kiểm tra quyền của user
        const forbiddenRoles = ['DOCTOR', 'NURSE'];
        if (forbiddenRoles.includes(currentUser.role)) {
            throw PATIENT_ERROR_CODES.FORBIDDEN;
        }

        // Xử lý dữ liệu đầu vào
        const mappedData: Record<string, any> = {};

        if (payload.full_name !== undefined) mappedData.full_name = ValidationPatientUtil.normalizeString(payload.full_name);
        if (payload.identity_number !== undefined) mappedData.identity_number = ValidationPatientUtil.normalizeString(payload.identity_number);
        if (payload.nationality !== undefined) mappedData.nationality = ValidationPatientUtil.normalizeString(payload.nationality);

        if (payload.date_of_birth !== undefined) {
            mappedData.date_of_birth = ValidationPatientUtil.parseAndValidateDateOfBirth(payload.date_of_birth);
        }

        if (payload.gender !== undefined) mappedData.gender = payload.gender;
        if (payload.identity_type !== undefined) mappedData.identity_type = payload.identity_type;
        if (payload.account_id !== undefined) mappedData.account_id = payload.account_id;
        if (payload.status !== undefined) mappedData.status = payload.status;
        if (payload.status_reason !== undefined) mappedData.status_reason = payload.status_reason;

        // Nếu client gọi API nhưng body rỗng
        if (Object.keys(mappedData).length === 0) {
            return { patient_id: patientId, message: 'Không có dữ liệu nào được cập nhật.' };
        }

        // Kiểm tra bệnh nhân tồn tại
        const oldPatientData = await patientRepository.getPatientById(patientId);
        if (!oldPatientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
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
            await patientRepository.updatePatient(patientId, mappedData, auditLogs);
        }

        return {
            patient_id: patientId,
            updated_at: new Date()
        };
    }



    /**
     * Cập nhật trạng thái hồ sơ bệnh nhân
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
        if (oldPatientData.status === 'DECEASED') {
            throw {
                httpCode: 409,
                code: 'DECEASED_LOCKED',
                message: 'Không thể thay đổi trạng thái của hồ sơ bệnh nhân đã báo tử.'
            };
        }

        // Nếu chuyển về ACTIVE thì tự động dọn dẹp
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

        await patientRepository.updatePatientStatus(
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


    /**
     * Liên kết hồ sơ bệnh nhân với tài khoản App
     */
    async linkPatient(payload: LinkPatientPayload, currentUser: { account_id: string; role: string }) {

        if (!payload.patient_code || !payload.verification_data || !payload.verification_data.identity_number || !payload.verification_data.date_of_birth) {
            throw PATIENT_ERROR_CODES.VALIDATION_ERROR;
        }

        const patientCode = payload.patient_code?.trim();
        if (!patientCode) {
            throw PATIENT_ERROR_CODES.VALIDATION_ERROR;
        }

        const identityNumber = ValidationPatientUtil.normalizeString(payload.verification_data.identity_number);
        
        let formattedDob: string;
        try {
            formattedDob = ValidationPatientUtil.parseAndValidateDateOfBirth(payload.verification_data.date_of_birth);
        } catch (error) {
            throw PATIENT_ERROR_CODES.LINK_FAILED; 
        }

        const patientData = await patientRepository.getPatientForLinking(patientCode);

        const dbFormattedDob = patientData?.date_of_birth || '';

        if (
            !patientData ||                                
            patientData.account_id !== null ||         
            patientData.identity_number !== identityNumber || 
            dbFormattedDob !== formattedDob             
        ) {
            throw PATIENT_ERROR_CODES.LINK_FAILED;
        }

        await patientRepository.linkAccount(
            patientData.patient_id,
            currentUser.account_id
        );

        return {
            patient_id: patientData.patient_id,
            patient_code: patientCode,
            linked_at: new Date()
        };
    }



    /**
     * Nghiệp vụ: Cập nhật thông tin liên hệ (Contact)
     */
    async updatePatientContactLogic(
        patientId: string, 
        payload: any,
        currentUser: { account_id: string; role: string }
    ) {
        // Validation
        let normalizedPhone = '';
        if (payload.phone_number) {
            normalizedPhone = ValidationPatientUtil.validatePhoneNumber(payload.phone_number);
        }

        const mappedData: Record<string, any> = {};
        if (normalizedPhone) mappedData.phone_number = normalizedPhone;
        if (payload.email !== undefined) mappedData.email = ValidationPatientUtil.normalizeString(payload.email);
        if (payload.street_address !== undefined) mappedData.street_address = ValidationPatientUtil.normalizeString(payload.street_address);
        if (payload.ward !== undefined) mappedData.ward = ValidationPatientUtil.normalizeString(payload.ward);
        if (payload.province !== undefined) mappedData.province = ValidationPatientUtil.normalizeString(payload.province);

        if (Object.keys(mappedData).length === 0) {
            throw { httpCode: 400, code: 'EMPTY_PAYLOAD', message: 'Không có dữ liệu hợp lệ để cập nhật.' };
        }

        // 2. Kiểm tra Business Rules
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }
        if (patientData.status === 'DECEASED') {
            throw { httpCode: 409, code: 'DECEASED_LOCKED', message: 'Không thể cập nhật liên hệ cho bệnh nhân đã báo tử.' };
        }

        if (mappedData.phone_number) {
            const isConflict = await patientRepository.checkPhoneConflict(mappedData.phone_number, patientId);
            if (isConflict) {
                throw { httpCode: 409, code: 'PHONE_CONFLICT', message: 'Số điện thoại này đã được sử dụng bởi một hồ sơ khác.' };
            }
        }

        // Chuẩn bị dữ liệu Audit Log
        const oldContactData = await (patientRepository as any).getPrimaryContactByPatientId(patientId); 
        
        const safeOldData = oldContactData || {}; 

        const auditLogs = AuditPatientUtil.generateLogRecords(
            safeOldData,
            mappedData,
            currentUser.account_id,
            patientId,
            'contact_' 
        );

        if (auditLogs.length > 0) {
            await patientRepository.updatePatientContact(patientId, mappedData, auditLogs);
        }

        return {
            patient_id: patientId,
            updated_fields: Object.keys(mappedData),
            updated_at: new Date()
        };
    }

    /**
     * Nghiệp vụ: Thêm mới người nhà 
     */
    async addPatientRelationLogic(
        patientId: string, 
        payload: any,
        currentUser: { account_id: string; role: string }
    ) {
        // Validation
        if (!payload.full_name || !payload.relationship || !payload.phone_number) {
            throw { httpCode: 400, code: 'MISSING_FIELDS', message: 'Họ tên, Mối quan hệ và Số điện thoại là bắt buộc.' };
        }

        const validRelationships = ['PARENT', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER'];
        if (!validRelationships.includes(payload.relationship.toUpperCase())) {
            throw { httpCode: 400, code: 'INVALID_RELATIONSHIP', message: 'Mối quan hệ không hợp lệ.' };
        }

        const normalizedPhone = ValidationPatientUtil.validatePhoneNumber(payload.phone_number);
        const normalizedFullName = ValidationPatientUtil.normalizeFullName(payload.full_name);

        // Kiểm tra Business Rules
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }
        if (patientData.status === 'DECEASED') {
            throw { httpCode: 409, code: 'DECEASED_LOCKED', message: 'Không thể thêm người nhà cho bệnh nhân đã báo tử.' };
        }

        // 3. Chuẩn bị Data & Audit
        const relationId = IdentifierPatientUtil.generateInternalId(); 
        const newRelationData = {
            relation_id: relationId,
            patient_id: patientId,
            full_name: normalizedFullName,
            relationship: payload.relationship.toUpperCase(),
            phone_number: normalizedPhone,
            is_emergency: payload.is_emergency || false,
            has_legal_rights: payload.has_legal_rights || false
        };

        const emptyOldData = {
            full_name: null, relationship: null, phone_number: null, is_emergency: null, has_legal_rights: null
        };

        const auditLogs = AuditPatientUtil.generateLogRecords(
            emptyOldData,
            {
                full_name: newRelationData.full_name,
                relationship: newRelationData.relationship,
                phone_number: newRelationData.phone_number,
                is_emergency: newRelationData.is_emergency,
                has_legal_rights: newRelationData.has_legal_rights
            },
            currentUser.account_id,
            patientId,
            'relation_'
        );

        // 4. Thực thi lưu trữ
        await patientRepository.insertPatientRelation(newRelationData, auditLogs);

        return {
            patient_id: patientId,
            relation_id: relationId,
            created_at: new Date()
        };
    }



}

export const patientService = new PatientService();