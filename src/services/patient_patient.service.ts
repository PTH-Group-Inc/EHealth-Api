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

        const page = Math.max(1, parseInt(queryParams.page) || 1);

        const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 10));

        const offset = (page - 1) * limit;

        const search = queryParams.search ? String(queryParams.search).trim() : undefined;
        const status = queryParams.status ? String(queryParams.status).trim().toUpperCase() : undefined;
        const gender = queryParams.gender ? String(queryParams.gender).trim().toUpperCase() : undefined;

        // Validate
        if (status && !['ACTIVE', 'INACTIVE', 'DECEASED'].includes(status)) {
            throw PATIENT_ERROR_CODES.INVALID_FILTER_STATUS;
        }

        if (gender && !['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'].includes(gender)) {
            throw PATIENT_ERROR_CODES.INVALID_FILTER_GENDER;
        }

        const { items, total } = await patientRepository.getPatientsList({
            limit,
            offset,
            search,
            status,
            gender
        });

        const totalPages = Math.ceil(total / limit) || 1;

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
            throw PATIENT_ERROR_CODES.MISSING_PHONE_NUMBER;
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

        const patientId = IdentifierPatientUtil.generateInternalId();
        const patientCode = IdentifierPatientUtil.generatePatientCode();
        const now = new Date();

        if (payload.identity_type && payload.identity_number) {
            const isExist = await patientRepository.checkIdentityConflict(
                payload.identity_type, 
                payload.identity_number,
                patientId
            );
            if (isExist) throw PATIENT_ERROR_CODES.DUPLICATE_STRONG;
        }

        

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

        // Sinh audit logs cho creation
        const auditLogs = AuditPatientUtil.generateLogRecords(
            {},
            {
                patient_code: newPatient.patient_code,
                full_name: newPatient.full_name,
                date_of_birth: newPatient.date_of_birth,
                gender: newPatient.gender,
                identity_type: newPatient.identity_type,
                identity_number: newPatient.identity_number,
                nationality: newPatient.nationality,
                status: newPatient.status
            },
            currentUser.account_id,
            newPatient.patient_id
        );

        // Gọi DB với audit logs
        await patientRepository.insertNewPatient(newPatient, newContact, auditLogs);

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
        const allowedRoles = ['ADMIN', 'SYSTEM', 'STAFF'];
        if (!allowedRoles.includes(currentUser.role)) {
            throw PATIENT_ERROR_CODES.FORBIDDEN;
        }

        // Kiểm tra bệnh nhân tồn tại trước tiên
        const oldPatientData = await patientRepository.getPatientById(patientId);
        if (!oldPatientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }

        if (oldPatientData.status === 'DECEASED') {
            throw PATIENT_ERROR_CODES.DECEASED_LOCKED;
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

        // Kiểm tra conflict identity nếu cập nhật identity
        const newIdentityType = mappedData.identity_type !== undefined ? mappedData.identity_type : oldPatientData.identity_type;
        const newIdentityNumber = mappedData.identity_number !== undefined ? mappedData.identity_number : oldPatientData.identity_number;

        // Chỉ chạy kiểm tra TRÙNG LẶP khi: Có đủ cả Loại & Số, VÀ 1 trong 2 thông tin này có sự thay đổi so với DB
        if (newIdentityType && newIdentityNumber) {
            if (newIdentityType !== oldPatientData.identity_type || newIdentityNumber !== oldPatientData.identity_number) {
                
                const hasConflict = await patientRepository.checkIdentityConflict(
                    newIdentityType as string,
                    newIdentityNumber as string,
                    patientId
                );
                
                if (hasConflict) {
                    throw PATIENT_ERROR_CODES.DUPLICATE_STRONG;
                }
            }
        }

        // Tạo audit logs
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
    async updatePatientStatus(
        patientId: string,
        payload: { status: string; status_reason?: string },
        currentUser: { account_id: string; role: string }
    ) {
        // Kiểm tra tính hợp lệ cơ bản
        const validStatuses = ['ACTIVE', 'INACTIVE', 'DECEASED'];
        if (!validStatuses.includes(payload.status)) {
            throw PATIENT_ERROR_CODES.INVALID_STATUS;
        }

        // Bắt buộc có lý do nếu ngưng theo dõi hoặc báo tử
        if (['INACTIVE', 'DECEASED'].includes(payload.status)) {
            if (!payload.status_reason || payload.status_reason.trim() === '') {
                throw PATIENT_ERROR_CODES.MISSING_STATUS_REASON;
            }
        }

        // Kiểm tra hồ sơ tồn tại
        const oldPatientData = await patientRepository.getPatientById(patientId);
        if (!oldPatientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }

        //Kiểm tra luồng logic trạng thái
        if (oldPatientData.status === 'DECEASED') {
            throw PATIENT_ERROR_CODES.DECEASED_STATUS_LOCKED;
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
                message: PATIENT_ERROR_CODES.STATUS_UNCHANGED.message
            };
        }

        // Kiểm tra ràng buộc chéo - Chỉ check khi chuẩn bị khóa hồ sơ
        if (['INACTIVE', 'DECEASED'].includes(payload.status)) {
            const hasConstraints = await patientRepository.checkBusinessConstraintsForStatusChange(patientId);
            if (hasConstraints) {
                throw PATIENT_ERROR_CODES.CONSTRAINT_VIOLATION;
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

        // Kiểm tra xem tài khoản App này đã liên kết với hồ sơ nào chưa
        const isAccountLinked = await patientRepository.checkAccountAlreadyLinked(currentUser.account_id);
        if (isAccountLinked) {
            throw PATIENT_ERROR_CODES.ACCOUNT_ALREADY_LINKED;
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
     * Thêm liên hệ phụ
     */
    async addPatientContact(patientId: string, payload: any, currentUser: { account_id: string; role: string }) {
        if (!payload.phone_number) throw PATIENT_ERROR_CODES.MISSING_PHONE_NUMBER;

        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        if (patientData.status === 'DECEASED') throw PATIENT_ERROR_CODES.DECEASED_LOCKED_CONTACT;

        const normalizedPhone = ValidationPatientUtil.validatePhoneNumber(payload.phone_number);
        const isConflict = await patientRepository.checkPhoneConflict(normalizedPhone, patientId);
        if (isConflict) throw PATIENT_ERROR_CODES.PHONE_CONFLICT;

        const contactId = IdentifierPatientUtil.generateInternalId();
        const newContactData = {
            contact_id: contactId,
            patient_id: patientId,
            phone_number: normalizedPhone,
            email: ValidationPatientUtil.normalizeString(payload.email),
            street_address: ValidationPatientUtil.normalizeString(payload.street_address),
            ward: ValidationPatientUtil.normalizeString(payload.ward),
            province: ValidationPatientUtil.normalizeString(payload.province),
            is_primary: false
        };

        const auditLogs = AuditPatientUtil.generateLogRecords(
            {}, newContactData, currentUser.account_id, patientId, 'contact_aux_'
        );

        await patientRepository.insertPatientContact(newContactData, auditLogs);

        return { patient_id: patientId, contact_id: contactId, created_at: new Date() };
    }

    /**
     * Cập nhật đích danh 1 liên hệ
     */
    async updateSpecificContact(patientId: string, contactId: string, payload: any, currentUser: { account_id: string; role: string }) {
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        if (patientData.status === 'DECEASED') throw PATIENT_ERROR_CODES.DECEASED_LOCKED_CONTACT;

        const oldContactData = await patientRepository.getPatientContactById(contactId, patientId);
        if (!oldContactData) {
            throw { httpCode: 404, code: 'CONTACT_NOT_FOUND', message: 'Không tìm thấy liên hệ hoặc đã bị xóa.' };
        }

        const mappedData: Record<string, any> = {};
        if (payload.phone_number) {
            mappedData.phone_number = ValidationPatientUtil.validatePhoneNumber(payload.phone_number);
            if (mappedData.phone_number !== oldContactData.phone_number) {
                const isConflict = await patientRepository.checkPhoneConflict(mappedData.phone_number, patientId);
                if (isConflict) throw PATIENT_ERROR_CODES.PHONE_CONFLICT;
            }
        }

        if (payload.email !== undefined) mappedData.email = ValidationPatientUtil.normalizeString(payload.email);
        if (payload.street_address !== undefined) mappedData.street_address = ValidationPatientUtil.normalizeString(payload.street_address);
        if (payload.ward !== undefined) mappedData.ward = ValidationPatientUtil.normalizeString(payload.ward);
        if (payload.province !== undefined) mappedData.province = ValidationPatientUtil.normalizeString(payload.province);

        if (Object.keys(mappedData).length === 0) throw PATIENT_ERROR_CODES.EMPTY_PAYLOAD;

        const auditLogs = AuditPatientUtil.generateLogRecords(oldContactData, mappedData, currentUser.account_id, patientId, 'contact_');
        
        if (auditLogs.length > 0) {
            await patientRepository.updatePatientContact(contactId, patientId, mappedData, auditLogs);
        }

        return { patient_id: patientId, contact_id: contactId, updated_at: new Date() };
    }

    /**
     * Xóa liên hệ
     */
    async deletePatientContact(patientId: string, contactId: string, currentUser: { account_id: string; role: string }) {
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        if (patientData.status === 'DECEASED') throw PATIENT_ERROR_CODES.DECEASED_LOCKED_CONTACT;

        const oldContactData = await patientRepository.getPatientContactById(contactId, patientId);
        if (!oldContactData) {
            throw { httpCode: 404, code: 'CONTACT_NOT_FOUND', message: 'Không tìm thấy liên hệ hoặc đã bị xóa.' };
        }

        // Không được xóa số điện thoại duy nhất/chính
        if (oldContactData.is_primary) {
            throw { httpCode: 400, code: 'CANNOT_DELETE_PRIMARY_CONTACT', message: 'Không thể xóa liên hệ chính. Hệ thống yêu cầu mỗi bệnh nhân phải có ít nhất 1 phương thức liên lạc.' };
        }

        const crypto = require('crypto');
        const auditLog = {
            log_id: crypto.randomUUID(),
            patient_id: patientId,
            changed_by: currentUser.account_id,
            field_name: 'contact_status',
            old_value: 'ACTIVE',
            new_value: 'DELETED'
        };

        await patientRepository.deletePatientContact(contactId, patientId, auditLog);

        return { patient_id: patientId, contact_id: contactId, message: 'Đã xóa liên hệ phụ thành công.' };
    }


    /**
     * Cập nhật thông tin liên hệ
     */
    async updatePatientContact(
        patientId: string, 
        payload: any,
        currentUser: { account_id: string; role: string }
    ) {
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
            throw PATIENT_ERROR_CODES.EMPTY_PAYLOAD;
        }

        // Kiểm tra Business Rules
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }
        if (patientData.status === 'DECEASED') {
            throw PATIENT_ERROR_CODES.DECEASED_LOCKED_CONTACT;
        }

        if (mappedData.phone_number) {
            const isConflict = await patientRepository.checkPhoneConflict(mappedData.phone_number, patientId);
            if (isConflict) {
                throw PATIENT_ERROR_CODES.PHONE_CONFLICT;
            }
        }

        // Audit Log
        const oldContactData = await (patientRepository as any).getPrimaryContactByPatientId(patientId); 
        if (!oldContactData || !oldContactData.contact_id) {
            throw PATIENT_ERROR_CODES.CONTACT_NOT_FOUND;
        }

        const safeOldData = oldContactData || {}; 

        const auditLogs = AuditPatientUtil.generateLogRecords(
            safeOldData,
            mappedData,
            currentUser.account_id,
            patientId,
            'contact_' 
        );

        if (auditLogs.length > 0) {
            await patientRepository.updatePatientContact(
                oldContactData.contact_id, 
                patientId, 
                mappedData, 
                auditLogs
            );
        }

        return {
            patient_id: patientId,
            updated_fields: Object.keys(mappedData),
            updated_at: new Date()
        };
    }

    /**
     * Thêm mới người nhà 
     */
    async addPatientRelation(
        patientId: string, 
        payload: any,
        currentUser: { account_id: string; role: string }
    ) {
        // Validation
        if (!payload.full_name || !payload.relationship || !payload.phone_number) {
            throw PATIENT_ERROR_CODES.MISSING_FIELDS;
        }

        const validRelationships = ['PARENT', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER'];
        if (!validRelationships.includes(payload.relationship.toUpperCase())) {
            throw PATIENT_ERROR_CODES.INVALID_RELATIONSHIP;
        }

        const normalizedPhone = ValidationPatientUtil.validatePhoneNumber(payload.phone_number);
        const normalizedFullName = ValidationPatientUtil.normalizeFullName(payload.full_name);

        // Kiểm tra Business Rules
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }
        if (patientData.status === 'DECEASED') {
            throw PATIENT_ERROR_CODES.DECEASED_LOCKED_RELATION;
        }

        // Chuẩn bị Data
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

    /**
     * Cập nhật thông tin người nhà
     */
    async updatePatientRelation(
        patientId: string, 
        relationId: string, 
        payload: any, 
        currentUser: { account_id: string; role: string }
    ) {
        // Kiểm tra Bệnh nhân
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        if (patientData.status === 'DECEASED') throw PATIENT_ERROR_CODES.DECEASED_LOCKED_RELATION;

        // Kiểm tra Người nhà tồn tại
        const oldRelationData = await patientRepository.getPatientRelationById(relationId, patientId);
        if (!oldRelationData) {
            throw { httpCode: 404, code: 'RELATION_NOT_FOUND', message: 'Không tìm thấy thông tin người nhà này.' };
        }

        // Chuẩn hóa dữ liệu mới
        const mappedData: Record<string, any> = {};
        
        if (payload.full_name !== undefined) mappedData.full_name = ValidationPatientUtil.normalizeFullName(payload.full_name);
        if (payload.phone_number !== undefined) mappedData.phone_number = ValidationPatientUtil.validatePhoneNumber(payload.phone_number);
        
        if (payload.relationship !== undefined) {
            const validRelationships = ['PARENT', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER'];
            const rel = payload.relationship.toUpperCase();
            if (!validRelationships.includes(rel)) throw PATIENT_ERROR_CODES.INVALID_RELATIONSHIP;
            mappedData.relationship = rel;
        }

        if (payload.is_emergency !== undefined) mappedData.is_emergency = payload.is_emergency;
        if (payload.has_legal_rights !== undefined) mappedData.has_legal_rights = payload.has_legal_rights;

        if (Object.keys(mappedData).length === 0) throw PATIENT_ERROR_CODES.EMPTY_PAYLOAD;

        // Audit & Cập nhật
        const auditLogs = AuditPatientUtil.generateLogRecords(
            oldRelationData, 
            mappedData, 
            currentUser.account_id, 
            patientId, 
            'relation_' 
        );

        if (auditLogs.length > 0) {
            await patientRepository.updatePatientRelation(relationId, patientId, mappedData, auditLogs);
        }

        return {
            patient_id: patientId,
            relation_id: relationId,
            updated_at: new Date()
        };
    }

    /**
     * Xóa thông tin người nhà
     */
    async deletePatientRelation(
        patientId: string, 
        relationId: string, 
        currentUser: { account_id: string; role: string }
    ) {
        // Check điều kiện bệnh nhân
        const patientData = await patientRepository.getPatientById(patientId);
        if (!patientData) throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        if (patientData.status === 'DECEASED') throw PATIENT_ERROR_CODES.DECEASED_LOCKED_RELATION;

        const oldRelationData = await patientRepository.getPatientRelationById(relationId, patientId);
        if (!oldRelationData) {
            throw { httpCode: 404, code: 'RELATION_NOT_FOUND', message: 'Không tìm thấy thông tin người nhà, hoặc dữ liệu đã bị xóa.' };
        }

        // Tạo Audit Log đúng bản chất đổi status
        const crypto = require('crypto');
        const auditLog = {
            log_id: crypto.randomUUID(),
            patient_id: patientId,
            changed_by: currentUser.account_id,
            field_name: 'relation_status', 
            old_value: 'ACTIVE',          
            new_value: 'DELETED'     
        };

        // Thực thi Update (Soft Delete)
        await patientRepository.deletePatientRelation(relationId, patientId, auditLog);

        return {
            patient_id: patientId,
            relation_id: relationId,
            message: 'Đã xóa thông tin người nhà thành công.'
        };
    }



    /**
     * Nghiệp vụ lấy chi tiết hồ sơ bệnh nhân
     */
    async getPatientDetai(patientId: string) {
        const patientDetail = await patientRepository.getPatientDetailById(patientId);
        
        if (!patientDetail) {
            throw PATIENT_ERROR_CODES.PATIENT_NOT_FOUND;
        }

        return patientDetail;
    }


}

export const patientService = new PatientService();