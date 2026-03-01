// file: routes/patient.route.ts
import { Router } from 'express';
import { PatientController } from '../controllers/patient_patient.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';
import { linkPatientRateLimiter } from '../middleware/rate_limit.middleware';

const patientRoutes = Router();

// Lấy danh sách bệnh nhân
patientRoutes.get('/', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF', 'DOCTOR', 'PHARMACIST'), PatientController.getPatientsList);

// Lấy chi tiết một bệnh nhân
patientRoutes.get('/:patient_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF', 'DOCTOR', 'PHARMACIST'), PatientController.getPatientDetail);


// tạo hồ sơ bệnh nhân
patientRoutes.post('/', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'SYSTEM'), PatientController.createPatient);

// Cập nhật thông tin hành chính bệnh nhân
patientRoutes.put('/:patient_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updatePatientInfo);

// Cập nhật trạng thái hồ sơ bệnh nhân (ACTIVE / INACTIVE / DECEASED)
patientRoutes.patch('/:patient_id/status',  verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'),  PatientController.updatePatientStatus);

// Liên kết hồ sơ bệnh nhân và thông tin định danh
patientRoutes.post('/link', verifyAccessToken, linkPatientRateLimiter, authorizeRoles('CUSTOMER'), PatientController.linkPatient);

// Cập nhật thông tin liên hệ bệnh nhân
patientRoutes.put('/:patient_id/contact',  verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'),  PatientController.updatePatientContact);

// Thêm liên hệ phụ
patientRoutes.post('/:patient_id/contacts', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.addSpecificContact);

// Cập nhật 1 liên hệ
patientRoutes.put('/:patient_id/contacts/:contact_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updateSpecificContact);

// Xóa liên hệ phụ
patientRoutes.delete('/:patient_id/contacts/:contact_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.deleteSpecificContact);

// Thêm mới thông tin người nhà
patientRoutes.post( '/:patient_id/relations',  verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'),  PatientController.addPatientRelation);

// Sửa thông tin người nhà
patientRoutes.put('/:patient_id/relations/:relation_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updatePatientRelation);

// Xóa thông tin người nhà
patientRoutes.delete( '/:patient_id/relations/:relation_id', verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.deletePatientRelation);





export default patientRoutes;