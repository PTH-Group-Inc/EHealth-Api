// file: routes/patient.route.ts
import { Router } from 'express';
import { PatientController } from '../controllers/patient_patient.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';
import { linkPatientRateLimiter } from '../middleware/rate_limit.middleware';

const patientRoutes = Router();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Lấy danh sách bệnh nhân
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Số bệnh nhân mỗi trang (tối đa 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã bệnh nhân
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['ACTIVE', 'INACTIVE', 'DECEASED']
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']
 *         description: Lọc theo giới tính
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Patient'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         current_page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - không đủ quyền
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
patientRoutes.get('/', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF', 'DOCTOR', 'PHARMACIST'), PatientController.getPatientsList);

/**
 * @swagger
 * /api/patients/{patient_id}:
 *   get:
 *     summary: Lấy chi tiết một bệnh nhân
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bệnh nhân
 *     responses:
 *       200:
 *         description: Chi tiết bệnh nhân
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
patientRoutes.get('/:patient_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF', 'DOCTOR', 'PHARMACIST'), PatientController.getPatientDetail);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Tạo hồ sơ bệnh nhân mới
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePatientRequest'
 *     responses:
 *       201:
 *         description: Hồ sơ bệnh nhân đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - yêu cầu quyền ADMIN, STAFF hoặc SYSTEM
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
patientRoutes.post('/', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'SYSTEM'), PatientController.createPatient);

/**
 * @swagger
 * /api/patients/{patient_id}:
 *   put:
 *     summary: Cập nhật thông tin hành chính bệnh nhân
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']
 *               identity_type:
 *                 type: string
 *                 enum: ['CCCD', 'PASSPORT', 'OTHER']
 *               identity_number:
 *                 type: string
 *               nationality:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
patientRoutes.put('/:patient_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updatePatientInfo);

/**
 * @swagger
 * /api/patients/{patient_id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hồ sơ bệnh nhân
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['status']
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['ACTIVE', 'INACTIVE', 'DECEASED']
 *               status_reason:
 *                 type: string
 *                 description: Lý do thay đổi trạng thái
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
patientRoutes.patch('/:patient_id/status',  verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'),  PatientController.updatePatientStatus);

/**
 * @swagger
 * /api/patients/link:
 *   post:
 *     summary: Liên kết hồ sơ bệnh nhân với thông tin định danh
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['patient_code', 'identity_number']
 *             properties:
 *               patient_code:
 *                 type: string
 *                 description: Mã bệnh nhân
 *                 example: 'PAT-2024-001'
 *               identity_number:
 *                 type: string
 *                 description: Số định danh (CCCD/Passport)
 *                 example: '123456789012'
 *     responses:
 *       200:
 *         description: Liên kết thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - chỉ CUSTOMER được phép
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Hồ sơ bệnh nhân không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Quá nhiều requests - rate limit (Tới đa 5 thử/15 phút)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
patientRoutes.post('/link', verifyAccessToken, linkPatientRateLimiter, authorizeRoles('CUSTOMER'), PatientController.linkPatient);

/**
 * @swagger
 * /api/patients/{patient_id}/contact:
 *   put:
 *     summary: Cập nhật thông tin liên hệ chính của bệnh nhân
 *     tags: [Patients - Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               street_address:
 *                 type: string
 *               ward:
 *                 type: string
 *               province:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
patientRoutes.put('/:patient_id/contact',  verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'),  PatientController.updatePatientContact);

/**
 * @swagger
 * /api/patients/{patient_id}/contacts:
 *   post:
 *     summary: Thêm liên hệ phụ cho bệnh nhân
 *     tags: [Patients - Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['phone_number']
 *             properties:
 *               phone_number:
 *                 type: string
 *               email:
 *                 type: string
 *               street_address:
 *                 type: string
 *               ward:
 *                 type: string
 *               province:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thêm liên hệ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
patientRoutes.post('/:patient_id/contacts', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.addSpecificContact);

/**
 * @swagger
 * /api/patients/{patient_id}/contacts/{contact_id}:
 *   put:
 *     summary: Cập nhật liên hệ phụ
 *     tags: [Patients - Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contact_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *               email:
 *                 type: string
 *               street_address:
 *                 type: string
 *               ward:
 *                 type: string
 *               province:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Liên hệ không tồn tại
 */
patientRoutes.put('/:patient_id/contacts/:contact_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updateSpecificContact);

/**
 * @swagger
 * /api/patients/{patient_id}/contacts/{contact_id}:
 *   delete:
 *     summary: Xóa liên hệ phụ
 *     tags: [Patients - Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contact_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Liên hệ không tồn tại
 */
patientRoutes.delete('/:patient_id/contacts/:contact_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.deleteSpecificContact);

/**
 * @swagger
 * /api/patients/{patient_id}/relations:
 *   post:
 *     summary: Thêm mới thông tin người thân/liên hệ khẩn cấp
 *     tags: [Patients - Relations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['full_name', 'relationship', 'phone_number']
 *             properties:
 *               full_name:
 *                 type: string
 *               relationship:
 *                 type: string
 *                 enum: ['PARENT', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER']
 *               phone_number:
 *                 type: string
 *               is_emergency:
 *                 type: boolean
 *               has_legal_rights:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Thêm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
patientRoutes.post( '/:patient_id/relations',  verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'),  PatientController.addPatientRelation);

/**
 * @swagger
 * /api/patients/{patient_id}/relations/{relation_id}:
 *   put:
 *     summary: Sửa thông tin người thân
 *     tags: [Patients - Relations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: relation_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               relationship:
 *                 type: string
 *                 enum: ['PARENT', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER']
 *               phone_number:
 *                 type: string
 *               is_emergency:
 *                 type: boolean
 *               has_legal_rights:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Người thân không tồn tại
 */
patientRoutes.put('/:patient_id/relations/:relation_id', verifyAccessToken, authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.updatePatientRelation);

/**
 * @swagger
 * /api/patients/{patient_id}/relations/{relation_id}:
 *   delete:
 *     summary: Xóa thông tin người thân
 *     tags: [Patients - Relations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: relation_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Người thân không tồn tại
 */
patientRoutes.delete( '/:patient_id/relations/:relation_id', verifyAccessToken,  authorizeRoles('ADMIN', 'SYSTEM', 'STAFF'), PatientController.deletePatientRelation);



export default patientRoutes;