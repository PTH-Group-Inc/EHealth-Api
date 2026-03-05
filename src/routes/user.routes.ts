import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { verifyAccessToken } from '../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware';

const userRoutes = Router();

userRoutes.use(verifyAccessToken);
userRoutes.use(authorizeRoles('ADMIN', 'SYSTEM'));

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: Quản lý người dùng (Dành cho Admin)
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo người dùng mới
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['roles', 'full_name']
 *             properties:
 *               email:
 *                 type: string
 *                 example: doctor.nguyen@ehealth.com
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               password:
 *                 type: string
 *                 description: Mật khẩu (Tùy chọn). Hệ thống tự sinh rỗng và gửi qua email nếu không truyền.
 *                 example: "SecurePass123!"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DOCTOR"]
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Bác Sĩ"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1985-12-25"
 *               gender:
 *                 type: string
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079085001234"
 *               address:
 *                 type: string
 *                 example: "123 Đường Y-Tế, Quận 1, TP.HCM"
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào (VD thiếu thông tin, email/sdt đã tồn tại)
 *       401:
 *         description: Chưa xác thực (Missing Token)
 *       403:
 *         description: Không có quyền truy cập (Not Admin)
 */
userRoutes.post('/', UserController.createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, email, sđt
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BANNED, PENDING]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
userRoutes.get('/', UserController.getUsers);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Tìm kiếm người dùng nhanh (Alias của Get List)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
userRoutes.get('/search', UserController.searchUsers);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Lấy chi tiết người dùng
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.get('/:userId', UserController.getUserById);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               email:
 *                 type: string
 *                 example: newemail.doctor@ehealth.com
 *               phone:
 *                 type: string
 *                 example: "0909999888"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DOCTOR", "MANAGER"]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BANNED, PENDING]
 *                 example: "ACTIVE"
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn Đã Đổi Tên"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1985-12-25"
 *               gender:
 *                 type: string
 *                 example: "MALE"
 *               identity_card_number:
 *                 type: string
 *                 example: "079085004321"
 *               avatar_url:
 *                 type: string
 *                 example: "https://example.com/images/avatar.jpg"
 *               address:
 *                 type: string
 *                 example: "Số 456, Đường Y-Tế Mới, Quận 1, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Email/sdt đã tồn tại
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.put('/:userId', UserController.updateUser);
userRoutes.patch('/:userId', UserController.updateUser);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Vô hiệu hóa (Soft Delete) người dùng
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.delete('/:userId', UserController.deleteUser);

/**
 * @swagger
 * /api/users/{userId}/lock:
 *   patch:
 *     summary: Khóa tài khoản
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Khóa tài khoản thành công
 *       400:
 *         description: Trạng thái tài khoản không hợp lệ (Đã khóa sẵn)
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.patch('/:userId/lock', UserController.lockUser);

/**
 * @swagger
 * /api/users/{userId}/unlock:
 *   patch:
 *     summary: Mở khóa tài khoản
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mở khóa tài khoản thành công
 *       400:
 *         description: Trạng thái tài khoản không hợp lệ (Không bị khóa)
 *       404:
 *         description: Không tìm thấy người dùng
 */
userRoutes.patch('/:userId/unlock', UserController.unlockUser);

export default userRoutes;
