/**
 * Patient Profile Routes (Multi-Profile)
 *
 * Module 1 — Multi-Patient Profiles
 * Mount at: /api/patient/profiles
 *
 * Endpoints (7):
 *   GET    /api/patient/profiles              — DS hồ sơ liên kết với account đang đăng nhập
 *   GET    /api/patient/profiles/default      — Hồ sơ mặc định
 *   GET    /api/patient/profiles/:id          — Chi tiết
 *   POST   /api/patient/profiles              — Tạo hồ sơ mới
 *   PUT    /api/patient/profiles/:id          — Cập nhật
 *   DELETE /api/patient/profiles/:id          — Ngừng sử dụng (soft delete)
 *   PATCH  /api/patient/profiles/:id/set-default — Đặt mặc định
 *   PUT    /api/patient/profiles/:id/relationship — Cập nhật quan hệ
 *
 * Tất cả endpoints yêu cầu authentication.
 */

import { Router } from 'express';
import { PatientProfileController } from '../../controllers/Patient Management/patient-profile.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';

const router = Router();

// Tất cả routes đều cần auth + session active
router.use(verifyAccessToken, checkSessionStatus);

/**
 * @swagger
 * /api/patient/profiles:
 *   get:
 *     tags: [Patient Profile]
 *     summary: Lấy danh sách hồ sơ bệnh nhân của tài khoản đang đăng nhập
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách profiles
 */
router.get('/', PatientProfileController.getMyProfiles);

/**
 * @swagger
 * /api/patient/profiles/default:
 *   get:
 *     tags: [Patient Profile]
 *     summary: Lấy hồ sơ mặc định
 *     security:
 *       - bearerAuth: []
 */
router.get('/default', PatientProfileController.getDefaultProfile);

/**
 * @swagger
 * /api/patient/profiles/{id}:
 *   get:
 *     tags: [Patient Profile]
 *     summary: Chi tiết 1 hồ sơ bệnh nhân
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.get('/:id', PatientProfileController.getProfileById);

/**
 * @swagger
 * /api/patient/profiles:
 *   post:
 *     tags: [Patient Profile]
 *     summary: Tạo hồ sơ bệnh nhân mới (cho bản thân hoặc người thân)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, date_of_birth, gender]
 *             properties:
 *               full_name: { type: string }
 *               date_of_birth: { type: string, format: date }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER] }
 *               phone_number: { type: string }
 *               email: { type: string }
 *               id_card_number: { type: string }
 *               address: { type: string }
 *               relationship: { type: string, enum: [SELF, PARENT, CHILD, SPOUSE, SIBLING, OTHER] }
 *               is_default: { type: boolean }
 */
router.post('/', PatientProfileController.createProfile);

/**
 * @swagger
 * /api/patient/profiles/{id}:
 *   put:
 *     tags: [Patient Profile]
 *     summary: Cập nhật hồ sơ
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', PatientProfileController.updateProfile);

/**
 * @swagger
 * /api/patient/profiles/{id}:
 *   delete:
 *     tags: [Patient Profile]
 *     summary: Ngừng sử dụng hồ sơ (soft delete)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', PatientProfileController.deleteProfile);

/**
 * @swagger
 * /api/patient/profiles/{id}/set-default:
 *   patch:
 *     tags: [Patient Profile]
 *     summary: Đặt hồ sơ làm mặc định
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/set-default', PatientProfileController.setDefault);

/**
 * @swagger
 * /api/patient/profiles/{id}/relationship:
 *   put:
 *     tags: [Patient Profile]
 *     summary: Cập nhật quan hệ với chủ tài khoản
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               relationship: { type: string, enum: [SELF, PARENT, CHILD, SPOUSE, SIBLING, OTHER] }
 */
router.put('/:id/relationship', PatientProfileController.updateRelationship);

export default router;
