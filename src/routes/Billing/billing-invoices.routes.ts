import { Router } from 'express';
import { BillingInvoiceController } from '../../controllers/Billing/billing-invoices.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// NHÓM 1: HÓA ĐƠN (Invoices)

/**
 * @swagger
 * /api/billing/invoices:
 *   post:
 *     summary: Tạo hóa đơn mới
 *     description: |
 *       Tạo hóa đơn trống cho bệnh nhân, có thể liên kết encounter.
 *       Thu ngân sẽ thêm dòng chi tiết (items) sau.
 *
 *       Phân quyền: BILLING_INVOICE_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 description: ID của bệnh nhân
 *                 example: "PAT_001"
 *               encounter_id:
 *                 type: string
 *                 nullable: true
 *                 description: ID của lượt khám (tuỳ chọn)
 *                 example: "ENC_abc123"
 *               facility_id:
 *                 type: string
 *                 nullable: true
 *                 description: ID cơ sở y tế
 *                 example: "FAC_001"
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 description: Ghi chú hóa đơn
 *                 example: "Khám tổng quát"
 *           example:
 *             patient_id: "PAT_001"
 *             encounter_id: "ENC_abc123"
 *             facility_id: "FAC_001"
 *             notes: "Khám tổng quát"
 *     responses:
 *       201:
 *         description: Tạo hóa đơn mới thành công
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
 *                   example: "Tạo hóa đơn thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoice_id:
 *                       type: string
 *                       example: "INV_20260313_001"
 *                     invoice_code:
 *                       type: string
 *                       example: "HĐ-20260313-001"
 *                     patient_id:
 *                       type: string
 *                     patient_info:
 *                       type: object
 *                       properties:
 *                         patient_id:
 *                           type: string
 *                         patient_name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     encounter_id:
 *                       type: string
 *                       nullable: true
 *                     facility_id:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total_amount:
 *                       type: number
 *                       example: 0
 *                     discount_amount:
 *                       type: number
 *                       example: 0
 *                     net_amount:
 *                       type: number
 *                       example: 0
 *                     insurance_amount:
 *                       type: number
 *                       example: 0
 *                     patient_pay_amount:
 *                       type: number
 *                       example: 0
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, UNPAID, PARTIAL, PAID, CANCELLED]
 *                       example: "DRAFT"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     notes:
 *                       type: string
 *       400:
 *         description: |
 *           - `PATIENT_NOT_FOUND`: Bệnh nhân không tồn tại
 *           - `MISSING_REQUIRED_FIELDS`: Thiếu patient_id
 *           - `INVALID_FACILITY`: Cơ sở không tồn tại
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền tạo hóa đơn
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/invoices', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.createInvoice);

/**
 * @swagger
 * /api/billing/invoices/generate/{encounterId}:
 *   post:
 *     summary: Tạo HĐ tự động từ encounter
 *     description: |
 *       Tự động gom tất cả: phí khám + chỉ định CLS + thuốc vào 1 hóa đơn.
 *       Tự động tính % BHYT nếu bệnh nhân có thẻ bảo hiểm còn hiệu lực.
 *       Tự động tạo claim BHYT.
 *
 *       Phân quyền: BILLING_INVOICE_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_abc123"
 *         description: ID của lượt khám/encounter
 *     responses:
 *       201:
 *         description: Tạo HĐ từ encounter thành công (kèm items + insurance claim)
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
 *                   example: "Tạo hóa đơn tự động thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoice_id:
 *                       type: string
 *                       example: "INV_20260313_001"
 *                     invoice_code:
 *                       type: string
 *                       example: "HĐ-20260313-001"
 *                     encounter_id:
 *                       type: string
 *                       example: "ENC_abc123"
 *                     patient_info:
 *                       type: object
 *                       properties:
 *                         patient_id:
 *                           type: string
 *                         patient_name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         insurance_id:
 *                           type: string
 *                         insurance_provider:
 *                           type: string
 *                     items:
 *                       type: array
 *                       description: Các dòng chi tiết hóa đơn (khám, CLS, thuốc)
 *                       items:
 *                         type: object
 *                         properties:
 *                           item_id:
 *                             type: string
 *                           service_type:
 *                             type: string
 *                             enum: [CONSULTATION, LAB_ORDER, DRUG]
 *                           service_name:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           unit_price:
 *                             type: number
 *                           total_price:
 *                             type: number
 *                     total_amount:
 *                       type: number
 *                       description: Tổng tiền chưa trừ BHYT
 *                       example: 500000
 *                     insurance_claim:
 *                       type: object
 *                       description: Thông tin claim bảo hiểm (nếu có)
 *                       properties:
 *                         claim_id:
 *                           type: string
 *                         insurance_percentage:
 *                           type: number
 *                           description: Phần trăm BHYT thanh toán (ví dụ 90)
 *                           example: 90
 *                         insurance_amount:
 *                           type: number
 *                           description: Số tiền BHYT thanh toán
 *                           example: 450000
 *                         patient_pay_amount:
 *                           type: number
 *                           description: Số tiền bệnh nhân cần trả
 *                           example: 50000
 *                         claim_status:
 *                           type: string
 *                           enum: [CREATED, SUBMITTED, APPROVED, REJECTED]
 *                           example: "CREATED"
 *                     net_amount:
 *                       type: number
 *                       description: Số tiền bệnh nhân phải trả (sau BHYT)
 *                       example: 50000
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, UNPAID, PARTIAL, PAID, CANCELLED]
 *                       example: "UNPAID"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: |
 *           - `ENCOUNTER_NOT_FOUND`: Encounter không tồn tại
 *           - `INVOICE_EXISTS`: Encounter đã có hóa đơn
 *           - `ENCOUNTER_NOT_COMPLETED`: Lượt khám chưa kết thúc
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền tạo hóa đơn
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/invoices/generate/:encounterId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.generateInvoice);

/**
 * @swagger
 * /api/billing/invoices/summary/{facilityId}:
 *   get:
 *     summary: Thống kê doanh thu cơ sở
 *     description: |
 *       Tổng hợp doanh thu: tổng thu, đã thu, còn nợ, BHYT, giảm giá.
 *       Phân tích theo trạng thái hóa đơn.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.5 Thống kê doanh thu]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_001"
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           example: "2026-01-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Thống kê doanh thu thành công
 */
router.get('/invoices/summary/:facilityId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.getRevenueSummary);

/**
 * @swagger
 * /api/billing/invoices/by-encounter/{encounterId}:
 *   get:
 *     summary: Lấy HĐ theo encounter
 *     description: |
 *       Tra cứu hóa đơn liên kết với lượt khám.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_abc123"
 *     responses:
 *       200:
 *         description: Chi tiết HĐ kèm items + payments
 *       404:
 *         description: Không tìm thấy HĐ cho encounter này
 */
router.get('/invoices/by-encounter/:encounterId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingInvoiceController.getByEncounter);

/**
 * @swagger
 * /api/billing/invoices/by-patient/{patientId}:
 *   get:
 *     summary: Lịch sử HĐ bệnh nhân
 *     description: |
 *       Danh sách tất cả hóa đơn của 1 bệnh nhân.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "PAT_001"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách HĐ của bệnh nhân
 */
router.get('/invoices/by-patient/:patientId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE', 'PATIENT'), BillingInvoiceController.getByPatient);

/**
 * @swagger
 * /api/billing/invoices:
 *   get:
 *     summary: Danh sách hóa đơn
 *     description: |
 *       Danh sách hóa đơn với filter đa chiều.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema:
 *           type: string
 *           example: "FAC_001"
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, UNPAID, PARTIAL, PAID, CANCELLED]
 *           example: "UNPAID"
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-01-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-12-31"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo mã HĐ hoặc tên bệnh nhân
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
 *         description: Danh sách hóa đơn + phân trang
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
 *                       invoice_id:
 *                         type: string
 *                       invoice_code:
 *                         type: string
 *                       patient_name:
 *                         type: string
 *                       total_amount:
 *                         type: number
 *                       net_amount:
 *                         type: number
 *                       status:
 *                         type: string
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
 *         description: Không có quyền xem
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/invoices', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingInvoiceController.getInvoices);

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}/insurance-claim:
 *   get:
 *     summary: Thông tin claim BHYT
 *     description: |
 *       Xem thông tin claim BHYT cho 1 hóa đơn.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.2.5 Thống kê doanh thu]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *     responses:
 *       200:
 *         description: Thông tin claim BHYT
 *       404:
 *         description: Không tìm thấy claim
 */
router.get('/invoices/:invoiceId/insurance-claim', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingInvoiceController.getInsuranceClaim);

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}:
 *   get:
 *     summary: Chi tiết hóa đơn
 *     description: |
 *       Xem chi tiết hóa đơn kèm danh sách items và payments.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *         description: ID của hóa đơn
 *     responses:
 *       200:
 *         description: Chi tiết HĐ kèm items + payments thành công
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
 *                     invoice_id:
 *                       type: string
 *                     invoice_code:
 *                       type: string
 *                     patient_info:
 *                       type: object
 *                       properties:
 *                         patient_id:
 *                           type: string
 *                         patient_name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     encounter_id:
 *                       type: string
 *                       nullable: true
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           item_id:
 *                             type: string
 *                           service_type:
 *                             type: string
 *                             enum: [CONSULTATION, LAB_ORDER, DRUG]
 *                           service_name:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           unit_price:
 *                             type: number
 *                           total_price:
 *                             type: number
 *                     total_amount:
 *                       type: number
 *                     discount_amount:
 *                       type: number
 *                     insurance_amount:
 *                       type: number
 *                     net_amount:
 *                       type: number
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           payment_id:
 *                             type: string
 *                           payment_date:
 *                             type: string
 *                             format: date-time
 *                           amount:
 *                             type: number
 *                           method:
 *                             type: string
 *                             enum: [CASH, CARD, TRANSFER, INSURANCE, OTHER]
 *                           status:
 *                             type: string
 *                             enum: [SUCCESS, FAILED, CANCELLED]
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, UNPAID, PARTIAL, PAID, CANCELLED]
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền xem
 *       404:
 *         description: Không tìm thấy HĐ
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/invoices/:invoiceId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingInvoiceController.getInvoiceById);

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}:
 *   put:
 *     summary: Cập nhật hóa đơn
 *     description: |
 *       Cập nhật giảm giá, ghi chú hóa đơn. Tự động tính lại net_amount.
 *       Chỉ cập nhật được HĐ chưa thanh toán hoặc thanh toán 1 phần.
 *
 *       Phân quyền: BILLING_INVOICE_UPDATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discount_amount:
 *                 type: number
 *                 example: 50000
 *               notes:
 *                 type: string
 *                 example: "Giảm giá cho bệnh nhân VIP"
 *     responses:
 *       200:
 *         description: Cập nhật HĐ thành công + tính lại tổng
 *       400:
 *         description: HĐ đã thanh toán hoặc đã hủy
 */
router.put('/invoices/:invoiceId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.updateInvoice);

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}/cancel:
 *   patch:
 *     summary: Hủy hóa đơn
 *     description: |
 *       Hủy hóa đơn. Bắt buộc phải cung cấp lý do.
 *       Không thể hủy HĐ đã có giao dịch thanh toán thành công (phải hoàn tiền trước).
 *
 *       Phân quyền: BILLING_INVOICE_CANCEL
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.1 Quản lý Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Bệnh nhân hủy khám"
 *     responses:
 *       200:
 *         description: Hủy HĐ thành công
 *       400:
 *         description: Không thể hủy HĐ đã thanh toán
 */
router.patch('/invoices/:invoiceId/cancel', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.cancelInvoice);

// ═══════════════════════════════════════════════════════
// NHÓM 2: CHI TIẾT HÓA ĐƠN (Invoice Items)
// ═══════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}/items:
 *   post:
 *     summary: Thêm dòng chi tiết HĐ
 *     description: |
 *       Thêm dòng phí khám (CONSULTATION), xét nghiệm (LAB_ORDER) hoặc thuốc (DRUG).
 *       Tự động tính lại tổng HĐ.
 *
 *       Phân quyền: BILLING_INVOICE_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.2 Chi tiết Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reference_type, reference_id, item_name, quantity, unit_price]
 *             properties:
 *               reference_type:
 *                 type: string
 *                 enum: [CONSULTATION, LAB_ORDER, DRUG]
 *                 example: "CONSULTATION"
 *               reference_id:
 *                 type: string
 *                 example: "FS_KB_07"
 *               item_name:
 *                 type: string
 *                 example: "Phí khám Nội tổng quát"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *               unit_price:
 *                 type: number
 *                 example: 200000
 *               discount_amount:
 *                 type: number
 *                 example: 0
 *               insurance_covered:
 *                 type: number
 *                 example: 40000
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thêm dòng chi tiết thành công
 */
router.post('/invoices/:invoiceId/items', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.addItem);

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}/items/{itemId}:
 *   put:
 *     summary: Sửa dòng chi tiết
 *     description: |
 *       Cập nhật số lượng, giá, giảm giá, BHYT cho dòng chi tiết.
 *       Tự động tính lại subtotal, patient_pays và tổng HĐ.
 *
 *       Phân quyền: BILLING_INVOICE_UPDATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.2 Chi tiết Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           example: "IDT_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               unit_price:
 *                 type: number
 *                 example: 150000
 *               discount_amount:
 *                 type: number
 *                 example: 10000
 *               insurance_covered:
 *                 type: number
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Cập nhật dòng chi tiết thành công
 */
router.put('/invoices/:invoiceId/items/:itemId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.updateItem);

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}/items/{itemId}:
 *   delete:
 *     summary: Xóa dòng chi tiết
 *     description: |
 *       Xóa dòng chi tiết khỏi HĐ. Tự động tính lại tổng.
 *
 *       Phân quyền: BILLING_INVOICE_UPDATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.2 Chi tiết Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa dòng chi tiết thành công
 */
router.delete('/invoices/:invoiceId/items/:itemId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.deleteItem);

/**
 * @swagger
 * /api/billing/invoices/{invoiceId}/recalculate:
 *   post:
 *     summary: Tính lại tổng tiền HĐ
 *     description: |
 *       Tính lại total_amount, insurance_amount, net_amount từ invoice_details.
 *       Hữu ích khi chỉnh sửa items bên ngoài hoặc đồng bộ dữ liệu.
 *
 *       Phân quyền: BILLING_INVOICE_UPDATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.2 Chi tiết Hóa đơn]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *     responses:
 *       200:
 *         description: Tính lại tổng thành công
 */
router.post('/invoices/:invoiceId/recalculate', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.recalculate);

// ═══════════════════════════════════════════════════════
// NHÓM 3: THANH TOÁN (Payments)
// ═══════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/payments:
 *   post:
 *     summary: Ghi nhận thanh toán
 *     description: |
 *       Tạo giao dịch thanh toán cho hóa đơn. Tự động cập nhật paid_amount và status.
 *       Hỗ trợ thanh toán 1 phần (PARTIAL). Kiểm tra overpayment.
 *
 *       Phân quyền: BILLING_PAYMENT_CREATE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.3 Thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoice_id, payment_method, amount]
 *             properties:
 *               invoice_id:
 *                 type: string
 *                 example: "INV_abc123"
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, CREDIT_CARD, VNPAY, MOMO]
 *                 example: "CASH"
 *               amount:
 *                 type: number
 *                 example: 500000
 *               gateway_transaction_id:
 *                 type: string
 *                 description: Mã giao dịch cổng TT (nếu online)
 *               notes:
 *                 type: string
 *                 example: "Bệnh nhân thanh toán tiền mặt"
 *     responses:
 *       201:
 *         description: Ghi nhận thanh toán thành công
 *       400:
 *         description: Số tiền không hợp lệ hoặc overpayment
 */
router.post('/payments', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.createPayment);

/**
 * @swagger
 * /api/billing/payments/by-invoice/{invoiceId}:
 *   get:
 *     summary: Giao dịch theo HĐ
 *     description: |
 *       Danh sách tất cả giao dịch (thanh toán + hoàn tiền) cho 1 hóa đơn.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF, DOCTOR, NURSE
 *     tags: [9.2.3 Thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "INV_abc123"
 *     responses:
 *       200:
 *         description: Danh sách giao dịch
 */
router.get('/payments/by-invoice/:invoiceId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF', 'DOCTOR', 'NURSE'), BillingInvoiceController.getPaymentsByInvoice);

/**
 * @swagger
 * /api/billing/payments/{paymentId}/refund:
 *   post:
 *     summary: Hoàn tiền
 *     description: |
 *       Tạo giao dịch hoàn tiền (REFUND). Bắt buộc cung cấp lý do.
 *       Tự động cập nhật paid_amount và status HĐ.
 *       Nếu hoàn toàn bộ, giao dịch gốc chuyển sang REFUNDED.
 *
 *       Phân quyền: BILLING_PAYMENT_REFUND
 *       Vai trò được phép: ADMIN
 *     tags: [9.2.3 Thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TXN_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, refund_reason]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 200000
 *               refund_reason:
 *                 type: string
 *                 example: "Bệnh nhân hủy dịch vụ xét nghiệm"
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, CREDIT_CARD, VNPAY, MOMO]
 *                 description: Nếu không gửi, dùng cùng phương thức giao dịch gốc
 *     responses:
 *       201:
 *         description: Hoàn tiền thành công
 *       400:
 *         description: GD chưa thành công hoặc số tiền hoàn vượt quá
 */
router.post('/payments/:paymentId/refund', verifyAccessToken, authorizeRoles('ADMIN'), BillingInvoiceController.refund);

/**
 * @swagger
 * /api/billing/payments/{paymentId}:
 *   get:
 *     summary: Chi tiết giao dịch
 *     description: |
 *       Xem chi tiết 1 giao dịch thanh toán hoặc hoàn tiền.
 *
 *       Phân quyền: BILLING_INVOICE_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.3 Thanh toán]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           example: "TXN_abc123"
 *     responses:
 *       200:
 *         description: Chi tiết giao dịch
 *       404:
 *         description: Không tìm thấy
 */
router.get('/payments/:paymentId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.getPaymentDetail);

// ═══════════════════════════════════════════════════════
// NHÓM 4: CA THU NGÂN (Cashier Shifts)
// ═══════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/cashier-shifts:
 *   post:
 *     summary: Mở ca thu ngân
 *     description: |
 *       Mở ca mới cho thu ngân. Mỗi thu ngân chỉ có 1 ca OPEN tại 1 thời điểm.
 *
 *       Phân quyền: BILLING_CASHIER_MANAGE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.4 Ca thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [opening_balance]
 *             properties:
 *               opening_balance:
 *                 type: number
 *                 example: 500000
 *                 description: Số tiền mặt đầu ca
 *               notes:
 *                 type: string
 *                 example: "Ca sáng"
 *     responses:
 *       201:
 *         description: Mở ca thành công
 *       400:
 *         description: Đang có ca mở
 */
router.post('/cashier-shifts', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.openShift);

/**
 * @swagger
 * /api/billing/cashier-shifts:
 *   get:
 *     summary: Danh sách ca thu ngân
 *     description: |
 *       Danh sách ca thu ngân với filter theo thu ngân, trạng thái, ngày.
 *
 *       Phân quyền: BILLING_CASHIER_MANAGE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.4 Ca thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: cashier_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, DISCREPANCY]
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           example: "2026-03-01"
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           example: "2026-03-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách ca
 */
router.get('/cashier-shifts', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.getShifts);

/**
 * @swagger
 * /api/billing/cashier-shifts/{shiftId}/close:
 *   patch:
 *     summary: Đóng ca thu ngân
 *     description: |
 *       Đóng ca thu ngân. Nhập số tiền thực đếm (actual_closing_balance).
 *       Hệ thống tự tính system_calculated_balance = opening + cash transactions.
 *       Nếu chênh lệch → status = DISCREPANCY, bằng nhau → CLOSED.
 *
 *       Phân quyền: BILLING_CASHIER_MANAGE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.4 Ca thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *           example: "CSH_abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [actual_closing_balance]
 *             properties:
 *               actual_closing_balance:
 *                 type: number
 *                 example: 1500000
 *                 description: Số tiền mặt thực tế khi đóng ca
 *               notes:
 *                 type: string
 *                 example: "Đóng ca bình thường"
 *     responses:
 *       200:
 *         description: Đóng ca thành công
 *       400:
 *         description: Ca đã đóng
 */
router.patch('/cashier-shifts/:shiftId/close', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.closeShift);

/**
 * @swagger
 * /api/billing/cashier-shifts/{shiftId}:
 *   get:
 *     summary: Chi tiết ca thu ngân
 *     description: |
 *       Xem chi tiết ca kèm tổng số giao dịch và tổng tiền.
 *
 *       Phân quyền: BILLING_CASHIER_MANAGE
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.2.4 Ca thu ngân]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *           example: "CSH_abc123"
 *     responses:
 *       200:
 *         description: Chi tiết ca kèm stats
 *       404:
 *         description: Không tìm thấy ca
 */
router.get('/cashier-shifts/:shiftId', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingInvoiceController.getShiftDetail);

export default router;
