import { Router } from 'express';
import { BillingReconciliationController } from '../../controllers/Billing/billing-reconciliation.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: ĐỐI SOÁT GIAO DỊCH
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/online:
 *   post:
 *     summary: Chạy đối soát giao dịch online
 *     description: |
 *       Gọi SePay API lấy giao dịch ngân hàng trong ngày, sau đó
 *       so sánh với `payment_transactions` (method=BANK_TRANSFER) trên hệ thống.
 *
 *       **Match logic:** gateway_transaction_id (system) ↔ reference_number (bank)
 *
 *       Kết quả phân loại:
 *       - **MATCHED:** Số tiền & mã tham chiếu khớp
 *       - **SYSTEM_ONLY:** Có trên hệ thống, không thấy trên ngân hàng
 *       - **EXTERNAL_ONLY:** Có trên ngân hàng, chưa ghi nhận trên hệ thống
 *       - **AMOUNT_MISMATCH:** Mã khớp nhưng chênh lệch số tiền
 *
 *       Phân quyền: BILLING_RECONCILE_RUN
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reconcile_date]
 *             properties:
 *               reconcile_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-19"
 *                 description: Ngày cần đối soát
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *           example:
 *             reconcile_date: "2026-03-19"
 *             facility_id: "FAC_001"
 *     responses:
 *       201:
 *         description: Đối soát online thành công — trả về session kèm items
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
 *                   example: "Chạy đối soát online thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     session_id:
 *                       type: string
 *                       example: "REC_20260319_001"
 *                     type:
 *                       type: string
 *                       enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT]
 *                       example: "ONLINE"
 *                     reconcile_date:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED]
 *                       example: "PENDING"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                           example: 25
 *                         matched_count:
 *                           type: integer
 *                           example: 22
 *                         system_only_count:
 *                           type: integer
 *                           example: 2
 *                         external_only_count:
 *                           type: integer
 *                           example: 1
 *                         amount_mismatch_count:
 *                           type: integer
 *                           example: 0
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           item_id:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [MATCHED, SYSTEM_ONLY, EXTERNAL_ONLY, AMOUNT_MISMATCH]
 *                           system_amount:
 *                             type: number
 *                           external_amount:
 *                             type: number
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: |
 *           - REC_017: Ngày không hợp lệ
 *           - REC_020: Đã đối soát ngày này
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ hoặc SePay API
 */
router.post('/reconciliation/online', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.runOnlineReconciliation);

/**
 * @swagger
 * /api/billing/reconciliation/shift/{shiftId}:
 *   post:
 *     summary: Chạy đối soát ca thu ngân
 *     description: |
 *       So sánh 3 giá trị cho ca đã đóng:
 *       1. **system_calculated_balance** — hệ thống tự tính (opening + payments - refunds)
 *       2. **actual_closing_balance** — thu ngân kê khai khi đóng ca
 *       3. **Σ denominations** — tổng mệnh giá × số lượng (Module 9.4)
 *
 *       Nếu 3 giá trị chênh lệch → tạo items AMOUNT_MISMATCH.
 *
 *       Phân quyền: BILLING_RECONCILE_RUN
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string, example: "CSH_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Đối soát ca sáng 19/03"
 *           example:
 *             notes: "Đối soát ca sáng 19/03"
 *     responses:
 *       201:
 *         description: Đối soát ca thành công
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
 *                     session_id:
 *                       type: string
 *                       example: "REC_shift_20240319_001"
 *                       description: ID phiên đối soát ca
 *                     type:
 *                       type: string
 *                       enum: [CASHIER_SHIFT]
 *                       example: "CASHIER_SHIFT"
 *                     status:
 *                       type: string
 *                       enum: [PENDING, REVIEWED, APPROVED, CLOSED]
 *                       example: "PENDING"
 *                     shift_id:
 *                       type: string
 *                       description: ID ca tính tiền
 *                     summary:
 *                       type: object
 *                       properties:
 *                         system_calculated_balance:
 *                           type: number
 *                           description: Số dư tính toán bởi hệ thống (opening + payments - refunds)
 *                           example: 5250000
 *                         actual_closing_balance:
 *                           type: number
 *                           description: Số dư thực tế khai báo khi đóng ca
 *                           example: 5280000
 *                         denominations_total:
 *                           type: number
 *                           description: Tổng mệnh giá nhập vào hệ thống
 *                           example: 5250000
 *                         variance:
 *                           type: number
 *                           description: Chênh lệch (actual - system)
 *                           example: 30000
 *                     items:
 *                       type: array
 *                       description: Danh sách các discrepancy nếu có
 *                       items:
 *                         type: object
 *                         properties:
 *                           item_id:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [AMOUNT_MISMATCH]
 *                           variance_amount:
 *                             type: number
 *                           notes:
 *                             type: string
 *                     notes:
 *                       type: string
 *                       example: "Đối soát ca sáng 19/03"
 *                     reconcile_date:
 *                       type: string
 *                       format: date
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: |
 *           - REC_009: Không tìm thấy ca
 *           - REC_010: Ca chưa đóng
 *           - REC_020: Đã đối soát ca này
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/reconciliation/shift/:shiftId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.runShiftReconciliation);

/**
 * @swagger
 * /api/billing/reconciliation/sessions:
 *   get:
 *     summary: Danh sách phiên đối soát
 *     description: |
 *       Lấy danh sách các phiên đối soát (online, ca thu ngân, hàng ngày) với filter.
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: 
 *           type: string
 *           enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT]
 *       - in: query
 *         name: status
 *         schema: 
 *           type: string
 *           enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED]
 *       - in: query
 *         name: facility_id
 *         schema: 
 *           type: string
 *       - in: query
 *         name: date_from
 *         schema: 
 *           type: string
 *           format: date
 *           example: "2026-03-01"
 *       - in: query
 *         name: date_to
 *         schema: 
 *           type: string
 *           format: date
 *           example: "2026-03-31"
 *       - in: query
 *         name: page
 *         schema: 
 *           type: integer
 *           default: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema: 
 *           type: integer
 *           default: 20
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách phiên đối soát + phân trang
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
 *                       session_id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT]
 *                       status:
 *                         type: string
 *                         enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED]
 *                       facility_id:
 *                         type: string
 *                       reconcile_date:
 *                         type: string
 *                         format: date
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/sessions', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSessions);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}:
 *   get:
 *     summary: Chi tiết phiên đối soát
 *     description: |
 *       Trả về session kèm tất cả items (từng dòng giao dịch khớp/không khớp).
 *       Dùng để xem chi tiết số tiền khớp, không khớp, chênh lệch.
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: string
 *           example: "REC_abc123"
 *         description: ID phiên đối soát
 *     responses:
 *       200:
 *         description: Chi tiết phiên đối soát thành công
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
 *                     session_id:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT]
 *                     status:
 *                       type: string
 *                       enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED]
 *                     reconcile_date:
 *                       type: string
 *                       format: date
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                         matched_count:
 *                           type: integer
 *                         system_only_count:
 *                           type: integer
 *                         external_only_count:
 *                           type: integer
 *                         amount_mismatch_count:
 *                           type: integer
 *                     items:
 *                       type: array
 *                       description: Danh sách từng dòng giao dịch
 *                       items:
 *                         type: object
 *                         properties:
 *                           item_id:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [MATCHED, SYSTEM_ONLY, EXTERNAL_ONLY, AMOUNT_MISMATCH]
 *                           system_transaction_id:
 *                             type: string
 *                           external_transaction_id:
 *                             type: string
 *                           system_amount:
 *                             type: number
 *                           external_amount:
 *                             type: number
 *                           notes:
 *                             type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiên đối soát
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/sessions/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSessionById);

/**
 * @swagger
 * /api/billing/reconciliation/shifts/{shiftId}/discrepancy:
 *   get:
 *     summary: Chi tiết chênh lệch ca thu ngân
 *     description: |
 *       Trả về so sánh 3 chiều: system balance, actual balance, denomination total.
 *       Kèm danh sách mệnh giá đã kê khai.
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.1 Đối soát giao dịch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string, example: "CSH_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết chênh lệch 3 chiều
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
 *                     shift_id:
 *                       type: string
 *                       example: "CSH_abc123"
 *                     shift_date:
 *                       type: string
 *                       format: date
 *                     opening_balance:
 *                       type: number
 *                       example: 0
 *                     system_calculated_balance:
 *                       type: number
 *                       description: Số dư tính toán (opening + transactions - refunds - voids)
 *                       example: 5250000
 *                     actual_closing_balance:
 *                       type: number
 *                       description: Số dư khai báo bởi nhân viên
 *                       example: 5280000
 *                     denominations_total:
 *                       type: number
 *                       description: Tổng tính từ mệnh giá
 *                       example: 5250000
 *                     discrepancies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           variance_type:
 *                             type: string
 *                             enum: [SYSTEM_VS_ACTUAL, SYSTEM_VS_DENOM, ACTUAL_VS_DENOM]
 *                           system_amount:
 *                             type: number
 *                           reference_amount:
 *                             type: number
 *                           variance_amount:
 *                             type: number
 *                           description:
 *                             type: string
 *                     denomination_details:
 *                       type: array
 *                       description: Danh sách mệnh giá đã kê khai
 *                       items:
 *                         type: object
 *                         properties:
 *                           denomination:
 *                             type: number
 *                             example: 500000
 *                           quantity:
 *                             type: integer
 *                             example: 10
 *                           subtotal:
 *                             type: number
 *                             example: 5000000
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy ca
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/shifts/:shiftId/discrepancy', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getShiftDiscrepancy);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: XỬ LÝ CHÊNH LỆCH
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/discrepancy-report:
 *   get:
 *     summary: Báo cáo chênh lệch tổng hợp
 *     description: |
 *       Tổng hợp tất cả items UNRESOLVED:
 *       - Phân loại severity: MINOR (< 10k), MAJOR (< 100k), CRITICAL (≥ 100k)
 *       - Nhóm theo loại đối soát (ONLINE/CASHIER_SHIFT)
 *       - 20 dòng chưa xử lý gần nhất
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: severity
 *         schema: 
 *           type: string
 *           enum: [MINOR, MAJOR, CRITICAL]
 *     responses:
 *       200:
 *         description: Báo cáo chênh lệch tổng hợp
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_count:
 *                           type: integer
 *                           example: 15
 *                         minor_count:
 *                           type: integer
 *                           example: 10
 *                         major_count:
 *                           type: integer
 *                           example: 3
 *                         critical_count:
 *                           type: integer
 *                           example: 2
 *                         total_variance:
 *                           type: number
 *                           example: 250000
 *                     by_type:
 *                       type: object
 *                       properties:
 *                         ONLINE:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: integer
 *                             total_variance:
 *                               type: number
 *                         CASHIER_SHIFT:
 *                           type: object
 *                           properties:
 *                             count:
 *                               type: integer
 *                             total_variance:
 *                               type: number
 *                     items:
 *                       type: array
 *                       description: Danh sách 20 item gần nhất chưa xử lý
 *                       items:
 *                         type: object
 *                         properties:
 *                           item_id:
 *                             type: string
 *                           session_id:
 *                             type: string
 *                           reconciliation_type:
 *                             type: string
 *                             enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT]
 *                           variance_amount:
 *                             type: number
 *                           severity:
 *                             type: string
 *                             enum: [MINOR, MAJOR, CRITICAL]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/discrepancy-report', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.getDiscrepancyReport);

/**
 * @swagger
 * /api/billing/reconciliation/items/{itemId}/resolve:
 *   patch:
 *     summary: Xử lý chênh lệch
 *     description: |
 *       Đánh dấu dòng chênh lệch đã xử lý (RESOLVED) hoặc ghi nhận bỏ qua (WRITTEN_OFF).
 *
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, example: "RI_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolution_status, resolution_notes]
 *             properties:
 *               resolution_status:
 *                 type: string
 *                 enum: [RESOLVED, WRITTEN_OFF]
 *                 example: "RESOLVED"
 *               resolution_notes:
 *                 type: string
 *                 example: "Đã đối chiếu với bank và xác nhận đúng"
 *           example:
 *             resolution_status: "RESOLVED"
 *             resolution_notes: "Đã đối chiếu với bank và xác nhận đúng"
 *     responses:
 *       200:
 *         description: Xử lý thành công
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
 *                     item_id:
 *                       type: string
 *                     session_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [RESOLVED, WRITTEN_OFF]
 *                     resolution_status:
 *                       type: string
 *                       enum: [RESOLVED, WRITTEN_OFF]
 *                     resolution_notes:
 *                       type: string
 *                     resolved_by:
 *                       type: string
 *                       description: User ID của người xử lý
 *                     resolved_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: |
 *           - REC_005: Không tìm thấy item
 *           - REC_006: Item đã xử lý rồi
 *           - REC_007: Thiếu trạng thái resolution
 *           - REC_008: Thiếu ghi chú
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/reconciliation/items/:itemId/resolve', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.resolveItem);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}/review:
 *   patch:
 *     summary: Review phiên đối soát (PENDING → REVIEWED)
 *     description: |
 *       Kế toán xác nhận đã kiểm tra phiên đối soát.
 *
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "REC_abc123" }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Đã kiểm tra, chênh lệch nhỏ chấp nhận được"
 *           example:
 *             notes: "Đã kiểm tra, chênh lệch nhỏ chấp nhận được"
 *     responses:
 *       200:
 *         description: Review thành công
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
 *                     session_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [REVIEWED]
 *                       example: "REVIEWED"
 *                     notes:
 *                       type: string
 *                     reviewed_by:
 *                       type: string
 *                     reviewed_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: REC_002 — Chỉ review khi PENDING
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiên
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/reconciliation/sessions/:id/review', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.reviewSession);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}/approve:
 *   patch:
 *     summary: Phê duyệt phiên đối soát (REVIEWED → APPROVED)
 *     description: |
 *       Kế toán trưởng phê duyệt kết quả đối soát.
 *
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "REC_abc123" }
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
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
 *                     session_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [APPROVED]
 *                       example: "APPROVED"
 *                     approved_by:
 *                       type: string
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: REC_003 — Chỉ approve khi REVIEWED
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiên
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/reconciliation/sessions/:id/approve', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.approveSession);

/**
 * @swagger
 * /api/billing/reconciliation/sessions/{id}/reject:
 *   patch:
 *     summary: Từ chối phiên đối soát (REVIEWED → REJECTED)
 *     description: |
 *       Kế toán từ chối kết quả đối soát và yêu cầu xử lý lại.
 *
 *       Phân quyền: BILLING_RECONCILE_RESOLVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.2 Xử lý chênh lệch]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "REC_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reject_reason]
 *             properties:
 *               reject_reason:
 *                 type: string
 *                 example: "Chênh lệch quá lớn, cần đối soát lại"
 *           example:
 *             reject_reason: "Chênh lệch quá lớn, cần đối soát lại"
 *     responses:
 *       200:
 *         description: Từ chối thành công
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
 *                     session_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [REJECTED]
 *                       example: "REJECTED"
 *                     reject_reason:
 *                       type: string
 *                     rejected_by:
 *                       type: string
 *                     rejected_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Chỉ reject khi REVIEWED
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiên
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/reconciliation/sessions/:id/reject', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.rejectSession);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: QUYẾT TOÁN
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/settlements:
 *   post:
 *     summary: Tạo phiếu quyết toán
 *     description: |
 *       Tự động tổng hợp từ `payment_transactions` theo khoảng thời gian:
 *       - Tổng revenue: cash, card, transfer, online
 *       - Tổng refunds, voids
 *       - Net revenue = total - refunds - voids
 *       - Snapshot discrepancies (đã có / chưa giải quyết)
 *
 *       Status ban đầu: **DRAFT**
 *
 *       Phân quyền: BILLING_SETTLEMENT_CREATE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [report_type, period_start, period_end]
 *             properties:
 *               report_type:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, CUSTOM]
 *                 example: "DAILY"
 *               period_start:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-19"
 *               period_end:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-19"
 *               facility_id:
 *                 type: string
 *                 example: "FAC_001"
 *               notes:
 *                 type: string
 *           example:
 *             report_type: "DAILY"
 *             period_start: "2026-03-19"
 *             period_end: "2026-03-19"
 *             facility_id: "FAC_001"
 *             notes: "Quyết toán hàng ngày"
 *     responses:
 *       201:
 *         description: Tạo phiếu thành công (DRAFT)
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
 *                     settlement_id:
 *                       type: string
 *                       example: "STL_20260319_001"
 *                     report_type:
 *                       type: string
 *                       enum: [DAILY, WEEKLY, MONTHLY, CUSTOM]
 *                     period_start:
 *                       type: string
 *                       format: date
 *                     period_end:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, SUBMITTED, APPROVED, REJECTED]
 *                       example: "DRAFT"
 *                     revenue_breakdown:
 *                       type: object
 *                       properties:
 *                         cash_total:
 *                           type: number
 *                         card_total:
 *                           type: number
 *                         transfer_total:
 *                           type: number
 *                         online_total:
 *                           type: number
 *                         gross_revenue:
 *                           type: number
 *                         total_refunds:
 *                           type: number
 *                         total_voids:
 *                           type: number
 *                         net_revenue:
 *                           type: number
 *                     discrepancy_summary:
 *                       type: object
 *                       properties:
 *                         resolved_count:
 *                           type: integer
 *                         unresolved_count:
 *                           type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: REC_017 — Ngày không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/reconciliation/settlements', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.createSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/submit:
 *   patch:
 *     summary: Gửi phiếu quyết toán (DRAFT → SUBMITTED)
 *     description: |
 *       Gửi phiếu quyết toán đi duyệt. Chỉ có thể gửi khi status là DRAFT.
 *
 *       Phân quyền: BILLING_SETTLEMENT_CREATE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Gửi thành công
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
 *                     settlement_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [SUBMITTED]
 *                       example: "SUBMITTED"
 *                     submitted_by:
 *                       type: string
 *                     submitted_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: REC_014 — Chỉ gửi khi DRAFT
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiếu
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/reconciliation/settlements/:id/submit', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.submitSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/approve:
 *   patch:
 *     summary: Phê duyệt quyết toán (SUBMITTED → APPROVED)
 *     description: |
 *       Hiệu trưởng phê duyệt phiếu quyết toán. Chỉ có thể phê duyệt khi status là SUBMITTED.
 *
 *       Phân quyền: BILLING_SETTLEMENT_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
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
 *                     settlement_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [APPROVED]
 *                       example: "APPROVED"
 *                     approved_by:
 *                       type: string
 *                     approved_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: REC_015 — Chỉ approve khi SUBMITTED
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiếu
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/reconciliation/settlements/:id/approve', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.approveSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/reject:
 *   patch:
 *     summary: Từ chối quyết toán (SUBMITTED → REJECTED)
 *     description: |
 *       Từ chối phiếu quyết toán. Chỉ có thể từ chối khi status là SUBMITTED.
 *       Yêu cầu ghi thích lý do từ chối để báo cho người soạn biết.
 *
 *       Phân quyền: BILLING_SETTLEMENT_APPROVE
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reject_reason]
 *             properties:
 *               reject_reason:
 *                 type: string
 *                 example: "Chưa giải quyết hết chênh lệch"
 *           example:
 *             reject_reason: "Chưa giải quyết hết chênh lệch"
 *     responses:
 *       200:
 *         description: Từ chối thành công
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
 *                     settlement_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [REJECTED]
 *                       example: "REJECTED"
 *                     reject_reason:
 *                       type: string
 *                     rejected_by:
 *                       type: string
 *                     rejected_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Chỉ reject khi SUBMITTED
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiếu
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/reconciliation/settlements/:id/reject', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.rejectSettlement);

/**
 * @swagger
 * /api/billing/reconciliation/settlements:
 *   get:
 *     summary: Danh sách phiếu quyết toán
 *     description: |
 *       Lấy danh sách phiếu quyết toán với filter theo loại, trạng thái, ngày.
 *       Hỗ trợ phân trang.
 *
 *       Phân quyền: BILLING_SETTLEMENT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [DAILY, WEEKLY, MONTHLY, CUSTOM] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, SUBMITTED, APPROVED, REJECTED] }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Danh sách phiếu + phân trang
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
 *                       settlement_id:
 *                         type: string
 *                       report_type:
 *                         type: string
 *                         enum: [DAILY, WEEKLY, MONTHLY, CUSTOM]
 *                       period_start:
 *                         type: string
 *                         format: date
 *                       period_end:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                         enum: [DRAFT, SUBMITTED, APPROVED, REJECTED]
 *                       facility_id:
 *                         type: string
 *                       net_revenue:
 *                         type: number
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/settlements', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSettlements);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}:
 *   get:
 *     summary: Chi tiết phiếu quyết toán
 *     description: |
 *       Kèm export_data (snapshot đầy đủ revenue breakdown + discrepancies).
 *       Cung cấp tất cả thông tin để export ra Excel/PDF.
 *
 *       Phân quyền: BILLING_SETTLEMENT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.3 Quyết toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết phiếu quyết toán
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
 *                     settlement_id:
 *                       type: string
 *                     report_type:
 *                       type: string
 *                       enum: [DAILY, WEEKLY, MONTHLY, CUSTOM]
 *                     period_start:
 *                       type: string
 *                       format: date
 *                     period_end:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, SUBMITTED, APPROVED, REJECTED]
 *                     revenue_breakdown:
 *                       type: object
 *                       properties:
 *                         cash_total:
 *                           type: number
 *                         card_total:
 *                           type: number
 *                         transfer_total:
 *                           type: number
 *                         online_total:
 *                           type: number
 *                         gross_revenue:
 *                           type: number
 *                         total_refunds:
 *                           type: number
 *                         total_voids:
 *                           type: number
 *                         net_revenue:
 *                           type: number
 *                     discrepancy_summary:
 *                       type: object
 *                       properties:
 *                         resolved_count:
 *                           type: integer
 *                         unresolved_count:
 *                           type: integer
 *                     approval_info:
 *                       type: object
 *                       properties:
 *                         submitted_by:
 *                           type: string
 *                         submitted_at:
 *                           type: string
 *                           format: date-time
 *                         approved_by:
 *                           type: string
 *                         approved_at:
 *                           type: string
 *                           format: date-time
 *                     export_data:
 *                       type: object
 *                       description: Snapshot đầy đủ để xuất Excel/PDF
 *                       properties:
 *                         title:
 *                           type: string
 *                         generated_at:
 *                           type: string
 *                           format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiếu
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/settlements/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getSettlementById);

// ═══════════════════════════════════════════════════════════════
// NHÓM 4: LỊCH SỬ & XUẤT BÁO CÁO
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/reconciliation/history:
 *   get:
 *     summary: Lịch sử đối soát
 *     description: |
 *       Danh sách tất cả phiên đối soát — filter theo loại, trạng thái, ngày.
 *       Tổng hợp từ tất cả phiên (ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT).
 *
 *       Phân quyền: BILLING_RECONCILE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.6.4 Lịch sử & xuất báo cáo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED] }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Danh sách lịch sử + phân trang
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
 *                       session_id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [ONLINE, CASHIER_SHIFT, DAILY_SETTLEMENT]
 *                       status:
 *                         type: string
 *                         enum: [PENDING, REVIEWED, APPROVED, REJECTED, CLOSED]
 *                       facility_id:
 *                         type: string
 *                       reconcile_date:
 *                         type: string
 *                         format: date
 *                       summary_stats:
 *                         type: object
 *                         properties:
 *                           total_amount:
 *                             type: number
 *                           variance_amount:
 *                             type: number
 *                           matched_count:
 *                             type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/history', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingReconciliationController.getHistory);

/**
 * @swagger
 * /api/billing/reconciliation/settlements/{id}/export:
 *   get:
 *     summary: Xuất data quyết toán
 *     description: |
 *       Trả về JSON đầy đủ cho frontend render Excel/PDF:
 *       report info, revenue breakdown, discrepancy summary,
 *       approval info, generated timestamp.
 *
 *       Phân quyền: BILLING_SETTLEMENT_VIEW
 *       Vai trò được phép: ADMIN
 *     tags: [9.6.4 Lịch sử & xuất báo cáo]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "STL_abc123" }
 *     responses:
 *       200:
 *         description: Data quyết toán (JSON) sẵn sàng để xuất
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
 *                     report_info:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: "Phiếu Quyết Toán Hàng Ngày"
 *                         settlement_id:
 *                           type: string
 *                         report_type:
 *                           type: string
 *                         period_start:
 *                           type: string
 *                           format: date
 *                         period_end:
 *                           type: string
 *                           format: date
 *                         facility_name:
 *                           type: string
 *                     revenue_breakdown:
 *                       type: object
 *                       properties:
 *                         cash_total:
 *                           type: number
 *                         card_total:
 *                           type: number
 *                         transfer_total:
 *                           type: number
 *                         online_total:
 *                           type: number
 *                         gross_revenue:
 *                           type: number
 *                         total_refunds:
 *                           type: number
 *                         total_voids:
 *                           type: number
 *                         net_revenue:
 *                           type: number
 *                     discrepancy_breakdown:
 *                       type: object
 *                       properties:
 *                         total_items:
 *                           type: integer
 *                         resolved_count:
 *                           type: integer
 *                         unresolved_count:
 *                           type: integer
 *                         total_variance:
 *                           type: number
 *                     approval_chain:
 *                       type: object
 *                       properties:
 *                         submitted_by:
 *                           type: string
 *                         submitted_at:
 *                           type: string
 *                           format: date-time
 *                         approved_by:
 *                           type: string
 *                         approved_at:
 *                           type: string
 *                           format: date-time
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiếu
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/reconciliation/settlements/:id/export', verifyAccessToken, authorizeRoles('ADMIN'), BillingReconciliationController.exportSettlement);

export default router;
