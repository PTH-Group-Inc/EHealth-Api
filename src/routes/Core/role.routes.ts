import { Router } from 'express';
import { RoleController } from '../../controllers/Core/role.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';

const roleRoutes = Router();

roleRoutes.use(verifyAccessToken);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Lấy danh sách Roles (Vai trò)
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       API trả về danh sách vai trò có phân trang/lọc.
 *     tags: [1.3.1 Quản lý danh mục vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã hoặc tên
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: is_system
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lấy danh sách vai trò thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roles_id:
 *                         type: string
 *                         example: "ROLE_001"
 *                       code:
 *                         type: string
 *                         example: "ADMIN"
 *                       name:
 *                         type: string
 *                         example: "Quản trị viên"
 *                       description:
 *                         type: string
 *                         example: "Người dùng có toàn quyền hệ thống"
 *                       is_system:
 *                         type: boolean
 *                         example: true
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE, INACTIVE]
 *                         example: "ACTIVE"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.get('/', RoleController.getRoles);

/**
 * @swagger
 * /api/roles/{roleId}:
 *   get:
 *     summary: Lấy chi tiết Role theo ID
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.1 Quản lý danh mục vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò cần lấy
 *         example: "ROLE_001"
 *     responses:
 *       200:
 *         description: Lấy chi tiết vai trò thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles_id:
 *                       type: string
 *                       example: "ROLE_001"
 *                     code:
 *                       type: string
 *                       example: "ADMIN"
 *                     name:
 *                       type: string
 *                       example: "Quản trị viên"
 *                     description:
 *                       type: string
 *                       example: "Người dùng có toàn quyền hệ thống"
 *                     is_system:
 *                       type: boolean
 *                       example: true
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE]
 *                       example: "ACTIVE"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy vai trò
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.get('/:roleId', RoleController.getRoleById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Tạo vai trò mới
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Tạo một vai trò mới trong hệ thống. Mã Code của vai trò phải là duy nhất (unique).
 *     tags: [1.3.1 Quản lý danh mục vai trò]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã vai trò (unique, không dấu, in hoa)
 *                 example: "CUSTOMER_CARE"
 *               name:
 *                 type: string
 *                 description: Tên vai trò (hiển thị cho người dùng)
 *                 example: "Chăm sóc khách hàng"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Mô tả chi tiết về vai trò
 *                 example: "Nhân sự hỗ trợ bệnh nhân"
 *           example:
 *             code: "CUSTOMER_CARE"
 *             name: "Chăm sóc khách hàng"
 *             description: "Nhân sự hỗ trợ bệnh nhân"
 *     responses:
 *       201:
 *         description: Tạo vai trò mới thành công
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
 *                   example: "Tạo vai trò thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles_id:
 *                       type: string
 *                       example: "ROLE_NEW_001"
 *                     code:
 *                       type: string
 *                       example: "CUSTOMER_CARE"
 *                     name:
 *                       type: string
 *                       example: "Chăm sóc khách hàng"
 *                     description:
 *                       type: string
 *                       example: "Nhân sự hỗ trợ bệnh nhân"
 *                     is_system:
 *                       type: boolean
 *                       example: false
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE]
 *                       example: "ACTIVE"
 *       400:
 *         description: |
 *           Các lỗi có thể:
 *           - `INVALID_CODE`: Mã Code không hợp lệ (không được trống, không dấu)
 *           - `DUPLICATE_CODE`: Mã Code đã tồn tại trong hệ thống
 *           - `MISSING_REQUIRED_FIELDS`: Thiếu trường bắt buộc
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.post('/', RoleController.createRole);

/**
 * @swagger
 * /api/roles/{roleId}:
 *   patch:
 *     summary: Cập nhật vai trò (Tên, Mô tả, Trạng thái)
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Cập nhật thông tin của vai trò. Chỉ có thể cập nhật các trường: name, description, status.
 *       Mã Code không thể thay đổi sau khi tạo.
 *     tags: [1.3.1 Quản lý danh mục vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò cần cập nhật
 *         example: "ROLE_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên vai trò mới
 *                 example: "Chuyên viên chăm sóc"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Mô tả chi tiết về vai trò
 *                 example: "Nhân sự hỗ trợ và chăm sóc bệnh nhân chi tiết"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 description: Trạng thái của vai trò
 *                 example: "ACTIVE"
 *           example:
 *             name: "Chuyên viên chăm sóc"
 *             description: "Nhân sự hỗ trợ và chăm sóc bệnh nhân chi tiết"
 *     responses:
 *       200:
 *         description: Cập nhật vai trò thành công
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
 *                   example: "Cập nhật vai trò thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles_id:
 *                       type: string
 *                       example: "ROLE_001"
 *                     code:
 *                       type: string
 *                       example: "CUSTOMER_CARE"
 *                     name:
 *                       type: string
 *                       example: "Chuyên viên chăm sóc"
 *                     description:
 *                       type: string
 *                       example: "Nhân sự hỗ trợ và chăm sóc bệnh nhân chi tiết"
 *                     is_system:
 *                       type: boolean
 *                       example: false
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE]
 *                       example: "ACTIVE"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy vai trò
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.patch('/:roleId', RoleController.updateRole);

/**
 * @swagger
 * /api/roles/{roleId}/status:
 *   patch:
 *     summary: Bật/Tắt (Active/Inactive) vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Thay đổi trạng thái hoạt động của vai trò. Vai trò INACTIVE sẽ không được gán cho người dùng mới.
 *     tags: [1.3.1 Quản lý danh mục vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò
 *         example: "ROLE_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 description: Trạng thái mới của vai trò
 *                 example: "INACTIVE"
 *           example:
 *             status: "INACTIVE"
 *     responses:
 *       200:
 *         description: Đổi trạng thái vai trò thành công
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
 *                   example: "Cập nhật trạng thái vai trò thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE]
 *       400:
 *         description: Trạng thái không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập hoặc không cho phép cập nhật vai trò hệ thống
 *       404:
 *         description: Không tìm thấy vai trò
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.patch('/:roleId/status', RoleController.updateRoleStatus);

/**
 * @swagger
 * /api/roles/{roleId}:
 *   delete:
 *     summary: Xóa vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Xóa một vai trò khỏi hệ thống. Không thể xóa vai trò mặc định của hệ thống.
 *       Trước khi xóa, phải xóa tất cả người dùng có vai trò này.
 *     tags: [1.3.1 Quản lý danh mục vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò cần xóa
 *         example: "ROLE_001"
 *     responses:
 *       200:
 *         description: Xóa vai trò thành công
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
 *                   example: "Xóa vai trò thành công"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không cho phép xóa Role mặc định của hệ thống
 *       404:
 *         description: Không tìm thấy vai trò
 *       409:
 *         description: Không thể xóa vai trò vì vẫn có người dùng đang giữ vai trò này
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.delete('/:roleId', RoleController.deleteRole);

// =========================================================================
// PHÂN QUYỀN (ROLE-PERMISSIONS)
// =========================================================================

/**
 * @swagger
 * /api/roles/{roleId}/permissions:
 *   get:
 *     summary: Lấy danh sách quyền của Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Trả về danh sách tất cả quyền được gán cho vai trò cụ thể.
 *     tags: [1.3.3 Gán quyền cho vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò
 *         example: "ROLE_001"
 *     responses:
 *       200:
 *         description: Lấy danh sách quyền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       permission_id:
 *                         type: string
 *                     example:
 *                       - permission_id: "PATIENT_VIEW"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy vai trò
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.get('/:roleId/permissions', RoleController.getRolePermissions);

/**
 * @swagger
 * /api/roles/{roleId}/permissions:
 *   put:
 *     summary: Thay thế (Replace) danh sách quyền của Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Thay thế toàn bộ danh sách quyền của vai trò bằng danh sách quyền mới.
 *       Tất cả quyền cũ sẽ bị xóa, chỉ giữ lại quyền trong danh sách mới.
 *     tags: [1.3.3 Gán quyền cho vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò
 *         example: "ROLE_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions:
 *                 type: array
 *                 description: Danh sách ID quyền (mới sẽ thay thế hoàn toàn cái cũ)
 *                 items:
 *                   type: string
 *                 example: ["PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE"]
 *           example:
 *             permissions: ["PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE"]
 *     responses:
 *       200:
 *         description: Cập nhật danh sách quyền thành công
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
 *                   example: "Cập nhật quyền thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Danh sách quyền không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập hoặc không được phép cập nhật vai trò hệ thống
 *       404:
 *         description: Không tìm thấy vai trò
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.put('/:roleId/permissions', RoleController.replaceRolePermissions);

/**
 * @swagger
 * /api/roles/{roleId}/permissions:
 *   post:
 *     summary: Gán thêm một quyền riêng lẻ cho Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Thêm một quyền mới vào danh sách quyền của vai trò.
 *       Nếu quyền đã tồn tại, sẽ trả về lỗi.
 *     tags: [1.3.3 Gán quyền cho vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò
 *         example: "ROLE_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permission_id]
 *             properties:
 *               permission_id:
 *                 type: string
 *                 description: ID của quyền cần gán (ví dụ: PATIENT_VIEW, PATIENT_CREATE)
 *                 example: "PATIENT_VIEW"
 *           example:
 *             permission_id: "PATIENT_VIEW"
 *     responses:
 *       201:
 *         description: Gán quyền cho vai trò thành công
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
 *                   example: "Gán quyền thành công"
 *                 data:
 *                   type: object
 *       400:
 *         description: |
 *           - `PERMISSION_ALREADY_ASSIGNED`: Quyền đã được gán cho vai trò
 *           - `INVALID_PERMISSION`: Quyền không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập hoặc không được phép cập nhật vai trò hệ thống
 *       404:
 *         description: Không tìm thấy vai trò hoặc quyền
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.post('/:roleId/permissions', RoleController.assignRolePermission);

/**
 * @swagger
 * /api/roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     summary: Xóa một quyền riêng lẻ khỏi Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *       Xóa một quyền khỏi danh sách quyền của vai trò.
 *       Nếu quyền không tồn tại, sẽ trả về lỗi.
 *     tags: [1.3.3 Gán quyền cho vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vai trò
 *         example: "ROLE_001"
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hoặc Code của quyền cần xóa
 *         example: "PATIENT_VIEW"
 *     responses:
 *       200:
 *         description: Xóa quyền khỏi vai trò thành công
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
 *                   example: "Xóa quyền thành công"
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập hoặc không được phép cập nhật vai trò hệ thống
 *       404:
 *         description: Không tìm thấy vai trò hoặc quyền không được gán cho vai trò
 *       500:
 *         description: Lỗi máy chủ
 */
roleRoutes.delete('/:roleId/permissions/:permissionId', RoleController.removeRolePermission);

// =========================================================================
// QUẢN LÝ MENU (ROLE-MENUS)
// =========================================================================

/**
 * @swagger
 * /api/roles/{roleId}/menus:
 *   get:
 *     summary: Lấy danh sách Menu của Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.5 Kiểm soát hiển thị menu theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
roleRoutes.get('/:roleId/menus', RoleController.getRoleMenus);

/**
 * @swagger
 * /api/roles/{roleId}/menus:
 *   post:
 *     summary: Gán thêm một Menu cho Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.5 Kiểm soát hiển thị menu theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menu_id]
 *             properties:
 *               menu_id:
 *                 type: string
 *                 example: "MENU_001"
 *     responses:
 *       201:
 *         description: Gán Menu thành công
 */
roleRoutes.post('/:roleId/menus', RoleController.assignRoleMenu);

/**
 * @swagger
 * /api/roles/{roleId}/menus/{menuId}:
 *   delete:
 *     summary: Xóa một Menu khỏi Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.5 Kiểm soát hiển thị menu theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *           description: ID hoặc Mã Code của Menu
 *     responses:
 *       200:
 *         description: Gỡ Menu thành công
 */
roleRoutes.delete('/:roleId/menus/:menuId', RoleController.removeRoleMenu);

// =========================================================================
// QUẢN LÝ API PERMISSIONS (ROLE-API)
// =========================================================================

/**
 * @swagger
 * /api/roles/{roleId}/api-permissions:
 *   get:
 *     summary: Lấy danh sách API được phép truy cập của Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.6 Kiểm soát API theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trả về danh sách API
 */
roleRoutes.get('/:roleId/api-permissions', RoleController.getRoleApiPermissions);

/**
 * @swagger
 * /api/roles/{roleId}/api-permissions:
 *   post:
 *     summary: Gán thêm một API cho Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.6 Kiểm soát API theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [api_id]
 *             properties:
 *               api_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Gán API Role thành công
 */
roleRoutes.post('/:roleId/api-permissions', RoleController.assignRoleApiPermission);

/**
 * @swagger
 * /api/roles/{roleId}/api-permissions/{apiId}:
 *   delete:
 *     summary: Xóa một API khỏi ranh giới Vai trò
 *     description: |
 *       **Vai trò được phép:** ADMIN
 *
 *     tags: [1.3.6 Kiểm soát API theo vai trò]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: apiId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gỡ API Role thành công
 */
roleRoutes.delete('/:roleId/api-permissions/:apiId', RoleController.removeRoleApiPermission);

export default roleRoutes;
