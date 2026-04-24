import { Router } from 'express';
import billingPricingRoutes from './billing-pricing.routes';
import billingInvoiceRoutes from './billing-invoices.routes';
import billingPaymentGatewayRoutes from './billing-payment-gateway.routes';
import billingOfflinePaymentRoutes from './billing-offline-payment.routes';
import billingDocumentRoutes from './billing-document.routes';
import billingReconciliationRoutes from './billing-reconciliation.routes';
import billingRefundRoutes from './billing-refund.routes';
import billingPricingPolicyRoutes from './billing-pricing-policy.routes';
import billingCashierAuthRoutes from './billing-cashier-auth.routes';

const router = Router();

// Module 9.1 – Quản lý danh mục dịch vụ & bảng giá
router.use('/pricing', billingPricingRoutes);

// Module 9.2 – Thu phí khám & dịch vụ y tế
router.use('/', billingInvoiceRoutes);

// Module 9.3 – Thanh toán trực tuyến (SePay)
router.use('/payments', billingPaymentGatewayRoutes);

// Module 9.4 – Thanh toán tại quầy (Offline Payment)
router.use('/', billingOfflinePaymentRoutes);

// Module 9.5 – Quản lý hóa đơn & chứng từ thanh toán
router.use('/', billingDocumentRoutes);

// Module 9.6 – Đối soát & quyết toán thanh toán
router.use('/', billingReconciliationRoutes);

// Module 9.7 – Hoàn tiền & điều chỉnh giao dịch
router.use('/', billingRefundRoutes);

// Module 9.8 – Quản lý chính sách giá & ưu đãi
router.use('/', billingPricingPolicyRoutes);

// Module 9.9 – Quản lý phân quyền thu ngân
router.use('/', billingCashierAuthRoutes);

export default router;
