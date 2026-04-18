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
import { uploadImage } from '../../middleware/upload.middleware';

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

/**
 * @swagger
 * /api/patient/profiles/{id}/avatar:
 *   post:
 *     tags: [Patient Profile]
 *     summary: Upload anh ho so chinh cho patient profile
 *     description: |
 *       **Phan quyen:** Yeu cau dang nhap bang Bearer Token.
 *       **Vai tro duoc phep:** Tai khoan BENH NHAN so huu patient profile do.
 *
 *       API upload anh ho so rieng cho tung patient profile.
 *       Request phai gui theo `multipart/form-data` voi field `avatar`.
 *       Backend se:
 *       - Kiem tra ownership theo `accountId` trong JWT.
 *       - Upload anh len Cloudinary folder `ehealth/patient-profiles/avatars`.
 *       - Thay the anh cu neu profile da co anh truoc do.
 *       - Van giu wire shape `avatar_url` dang mang JSONB de dong bo voi core profile.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *         description: ID patient profile can upload anh
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File anh JPG, PNG hoac WebP toi da 5MB
 *     responses:
 *       200:
 *         description: Upload anh thanh cong
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
 *                   example: Tai anh ho so benh nhan thanh cong.
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/v1711878000000/ehealth/patient-profiles/avatars/patient_avatar_550e8400-e29b-41d4-a716-446655440000_1711878000000.png
 *                     public_id:
 *                       type: string
 *                       example: ehealth/patient-profiles/avatars/patient_avatar_550e8400-e29b-41d4-a716-446655440000_1711878000000
 *                     uploaded_at:
 *                       type: string
 *                       example: 2026-04-17T09:30:00.000Z
 *       400:
 *         description: Thieu file hoac file khong hop le
 *       401:
 *         description: Chua dang nhap hoac token het han
 *       403:
 *         description: Khong thuoc quyen so huu patient profile
 *       404:
 *         description: Khong tim thay patient profile
 *       500:
 *         description: Loi upload Cloudinary hoac luu metadata
 */
router.post('/:id/avatar', uploadImage.single('avatar'), PatientProfileController.uploadAvatar);

/**
 * @swagger
 * /api/patient/profiles/{id}/avatar:
 *   delete:
 *     tags: [Patient Profile]
 *     summary: Xoa anh ho so cua patient profile
 *     description: |
 *       **Phan quyen:** Yeu cau dang nhap bang Bearer Token.
 *       **Vai tro duoc phep:** Tai khoan BENH NHAN so huu patient profile do.
 *
 *       Xoa anh ho so hien tai theo `public_id`.
 *       Backend se xoa metadata trong `patients.avatar_url` va goi Cloudinary destroy cho file tuong ung.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *         description: ID patient profile can xoa anh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - public_id
 *             properties:
 *               public_id:
 *                 type: string
 *                 example: ehealth/patient-profiles/avatars/patient_avatar_550e8400-e29b-41d4-a716-446655440000_1711878000000
 *                 description: Public ID cua anh can xoa
 *     responses:
 *       200:
 *         description: Xoa anh thanh cong
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
 *                   example: Xoa anh ho so benh nhan thanh cong.
 *       400:
 *         description: Thieu public_id trong request body
 *       401:
 *         description: Chua dang nhap hoac token het han
 *       403:
 *         description: Khong thuoc quyen so huu patient profile
 *       404:
 *         description: Anh ho so khong ton tai hoac patient profile khong hop le
 *       500:
 *         description: Loi xoa metadata hoac file Cloudinary
 */
router.delete('/:id/avatar', PatientProfileController.deleteAvatar);

export default router;
