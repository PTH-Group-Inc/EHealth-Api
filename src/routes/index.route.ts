import { Express } from 'express'
import productRouter from './Core/testProduct.route';
import authRoutes from './Core/auth.routes';
import userRoutes from './Core/user.routes';
import roleRoutes from './Core/role.routes';
import facilityRoutes from './Facility Management/facility.routes';
import branchRoutes from './Facility Management/branch.routes';
import departmentRoutes from './Facility Management/department.routes';
import medicalRoomRoutes from './Facility Management/medical-room.routes';
import permissionRoutes from './Core/permission.routes';
import moduleRoutes from './Core/module.routes';
import menuRoutes from './Core/menu.routes';
import apiPermissionRoutes from './Core/api-permission.routes';
import systemRoutes from './Core/system.routes';
import specialtyRouter from './Facility Management/specialty.route';
import masterDataRoutes from './Core/master-data.routes';
import { drugCategoryRoutes } from './Medication Management/drug-category.routes';
import { drugRoutes } from './Medication Management/drug.routes';
import medicalServiceRoutes from './Facility Management/medical-service.routes';
import specialtyServiceRoutes from './Facility Management/specialty-service.routes';
import departmentSpecialtyRoutes from './Facility Management/department-specialty.routes';
import doctorServiceRoutes from './Facility Management/doctor-service.routes';
import medicalEquipmentRoutes from './Facility Management/medical-equipment.routes';
import { bedRoutes } from './Facility Management/bed.routes';
import bookingConfigRoutes from './Facility Management/booking-config.routes';
import profileRoutes from './Core/profile.routes';
import notificationCategoryRoutes from './Core/notification-category.routes';
import notificationTemplateRoutes from './Core/notification-template.routes';
import notificationRoleConfigRoutes from './Core/notification-role-config.routes';
import userNotificationRoutes from './Core/user-notification.routes';
import staffRoutes from './Facility Management/staff.routes';
import shiftRoutes from './Facility Management/shift.routes';
import { slotRoutes } from './Facility Management/appointment-slot.routes';
import { staffScheduleRoutes } from './Facility Management/staff-schedule.routes';
import { leaveRoutes } from './Facility Management/leave.routes';
import { shiftSwapRoutes } from './Facility Management/shift-swap.routes';
import { licenseRoutes } from './Facility Management/license.routes';
import { operatingHourRoutes } from './Facility Management/operating-hour.routes';
import { closedDayRoutes } from './Facility Management/closed-day.routes';
import { holidayRoutes } from './Facility Management/holiday.routes';
import { facilityStatusRoutes } from './Facility Management/facility-status.routes';
import { patientRoutes } from './Patient Management/patient.routes';
import patientProfileRoutes from './Patient Management/patient-profile.routes';
import { medicalHistoryRoutes } from './Patient Management/medical-history.routes';
import insuranceProviderRoutes from './Patient Management/insurance-provider.routes';
import patientInsuranceRoutes from './Patient Management/patient-insurance.routes';
import insuranceCoverageRoutes from './Patient Management/insurance-coverage.routes';
import { relationTypeRoutes } from './Patient Management/relation-type.routes';
import { patientContactRoutes } from './Patient Management/patient-contact.routes';
import { documentTypeRoutes } from './Patient Management/document-type.routes';
import { patientDocumentRoutes } from './Patient Management/patient-document.routes';
import { patientTagRoutes } from './Patient Management/patient-tag.routes';
import { classificationRuleRoutes } from './Patient Management/classification-rule.routes';
import { appointmentRoutes } from './Appointment Management/appointment.routes';
import { consultationDurationRoutes } from './Appointment Management/consultation-duration.routes';
import { lockedSlotRoutes } from './Appointment Management/locked-slot.routes';
import { shiftServiceRoutes } from './Appointment Management/shift-service.routes';
import { doctorAvailabilityRoutes } from './Appointment Management/doctor-availability.routes';
import { doctorAbsenceRoutes } from './Appointment Management/doctor-absence.routes';
import { appointmentConfirmationRoutes } from './Appointment Management/appointment-confirmation.routes';
import { appointmentStatusRoutes } from './Appointment Management/appointment-status.routes';
import appointmentChangeRoutes from './Appointment Management/appointment-change.routes';
import appointmentCoordinationRoutes from './Appointment Management/appointment-coordination.routes';
import { roomMaintenanceRoutes } from './Facility Management/room-maintenance.routes';
import { encounterRoutes } from './EMR/encounter.routes';
import { clinicalExamRoutes } from './EMR/clinical-exam.routes';
import { diagnosisRoutes } from './EMR/diagnosis.routes';
import medicalOrderRoutes from './EMR/medical-order.routes';
import { prescriptionRoutes } from './EMR/prescription.routes';
import { medicalRecordRoutes } from './EMR/medical-record.routes';
import { treatmentProgressRoutes } from './EMR/treatment-progress.routes';
import { signOffRoutes } from './EMR/medical-signoff.routes';
import { dispensingRoutes } from './Medication Management/dispensing.routes';
import { inventoryRoutes } from './Medication Management/inventory.routes';
import { warehouseRoutes } from './Medication Management/warehouse.routes';
import { supplierRoutes } from './Medication Management/supplier.routes';
import { stockInRoutes } from './Medication Management/stock-in.routes';
import { stockOutRoutes } from './Medication Management/stock-out.routes';
import { medInstructionRoutes } from './Medication Management/med-instruction.routes';
import { healthProfileRoutes } from './EHR/health-profile.routes';
import { healthTimelineRoutes } from './EHR/health-timeline.routes';
import { medicalHistoryEhrRoutes } from './EHR/medical-history-ehr.routes';
import { clinicalResultsRoutes } from './EHR/clinical-results.routes';
import { medicationTreatmentRoutes } from './EHR/medication-treatment.routes';
import { vitalSignsRoutes } from './EHR/vital-signs.routes';
import { dataIntegrationRoutes } from './EHR/data-integration.routes';
import billingPricingRoutes from './Billing/billing-pricing.routes';
import billingInvoiceRoutes from './Billing/billing-invoices.routes';
import billingPaymentGatewayRoutes from './Billing/billing-payment-gateway.routes';
import billingOfflinePaymentRoutes from './Billing/billing-offline-payment.routes';
import billingDocumentRoutes from './Billing/billing-document.routes';
import billingReconciliationRoutes from './Billing/billing-reconciliation.routes';
import billingRefundRoutes from './Billing/billing-refund.routes';
import billingPricingPolicyRoutes from './Billing/billing-pricing-policy.routes';
import billingCashierAuthRoutes from './Billing/billing-cashier-auth.routes';
import { reportsRoutes } from './Reports/reports.routes';
import { teleConsultationTypeRoutes } from './Remote Consultation/tele-consultation-type.routes';
import { teleBookingRoutes } from './Remote Consultation/tele-booking.routes';
import { teleRoomRoutes } from './Remote Consultation/tele-room.routes';
import { medicalChatRoutes } from './Remote Consultation/tele-medical-chat.routes';
import { teleResultRoutes } from './Remote Consultation/tele-result.routes';
import { telePrescriptionRoutes } from './Remote Consultation/tele-prescription.routes';
import { teleFollowUpRoutes } from './Remote Consultation/tele-followup.routes';
import { teleQualityRoutes } from './Remote Consultation/tele-quality.routes';
import { teleConfigRoutes } from './Remote Consultation/tele-config.routes';
import { verifySepayWebhook } from '../middleware/verifyWebhook.middleware';
import { sepayWebhook } from '../controllers/Billing/billing-payment-gateway.controller';
import { auditMiddleware } from '../middleware/audit.middleware';

import healthRoutes from './Core/health.routes';

import { Router } from 'express';

const v1Routes = Router();
v1Routes.use((req, res, next) => {
    res.setHeader('X-API-Version', 'v1');
    next();
});

export const initRoutes = (app: Express) => {
    // Health checks and metrics (Before Audit Middleware to avoid logging)
    app.use('/', healthRoutes);

    // Audit Middleware
    app.use(auditMiddleware);

    //test product routes
    v1Routes.use('/test', productRouter)

    //auth routes
    v1Routes.use('/auth', authRoutes);

    //user management routes
    v1Routes.use('/users', userRoutes);

    //medical staff management routes
    v1Routes.use('/staff', staffRoutes);

    //shift management routes
    v1Routes.use('/shifts', shiftRoutes);

    //appointment slot routes
    v1Routes.use('/slots', slotRoutes);

    //staff schedule routes
    v1Routes.use('/staff-schedules', staffScheduleRoutes);

    //leave management routes
    v1Routes.use('/leaves', leaveRoutes);

    //shift swap routes
    v1Routes.use('/shift-swaps', shiftSwapRoutes);

    //license management routes
    v1Routes.use('/licenses', licenseRoutes);

    //operating hours management routes
    v1Routes.use('/operating-hours', operatingHourRoutes);

    //closed days management routes
    v1Routes.use('/closed-days', closedDayRoutes);

    //holidays management routes
    v1Routes.use('/holidays', holidayRoutes);

    //facility status & calendar routes
    v1Routes.use('/facility-status', facilityStatusRoutes);

    //role dropdowns routes
    v1Routes.use('/roles', roleRoutes);

    //facility dropdown routes
    v1Routes.use('/facilities', facilityRoutes);

    //branch management routes
    v1Routes.use('/branches', branchRoutes);

    //department management routes
    v1Routes.use('/departments', departmentRoutes);

    //medical rooms management routes
    v1Routes.use('/medical-rooms', medicalRoomRoutes);

    //permissions routes
    v1Routes.use('/permissions', permissionRoutes);

    // feature modules routes
    v1Routes.use('/modules', moduleRoutes);

    // system menus routes
    v1Routes.use('/menus', menuRoutes);

    // api permission settings
    v1Routes.use('/api-permissions', apiPermissionRoutes);

    // system settings routes
    v1Routes.use('/system', systemRoutes);

    // specialty routes
    v1Routes.use('/specialties', specialtyRouter);

    // master data routes
    v1Routes.use('/master-data', masterDataRoutes);

    // Module 5.1 – Medication Management (Danh mục thuốc & Dữ liệu chuẩn)
    v1Routes.use('/pharmacy/categories', drugCategoryRoutes);
    v1Routes.use('/pharmacy/drugs', drugRoutes);

    // Module 5.5 – Dispensing Management (Cấp phát thuốc & xuất kho)
    v1Routes.use('/dispensing', dispensingRoutes);

    // Module 5.6 – Drug Inventory Tracking (Theo dõi tồn kho)
    v1Routes.use('/inventory', inventoryRoutes);

    // Warehouse Management (Quản lý kho thuốc)
    v1Routes.use('/warehouses', warehouseRoutes);

    // Module 5.7/5.8 – Stock-In Management (Nhập kho & NCC)
    v1Routes.use('/suppliers', supplierRoutes);
    v1Routes.use('/stock-in', stockInRoutes);

    // Module 5.9 – Stock-Out Management (Xuất kho & Hủy hàng)
    v1Routes.use('/stock-out', stockOutRoutes);

    // Module 5.10 – Medication Instructions (Hướng dẫn sử dụng thuốc)
    v1Routes.use('/medication-instructions', medInstructionRoutes);

    // medical services
    v1Routes.use('/medical-services', medicalServiceRoutes);

    // specialty-service mapping (2.9.1)
    v1Routes.use('/specialty-services', specialtyServiceRoutes);

    // Gán chuyên khoa - Phòng ban (2.3.1)
    v1Routes.use('/department-specialties', departmentSpecialtyRoutes);

    //doctor services routes
    v1Routes.use('/doctor-services', doctorServiceRoutes);

    // medical equipment management (2.10)
    v1Routes.use('/equipments', medicalEquipmentRoutes);

    // bed management (2.11)
    v1Routes.use('/beds', bedRoutes);

    // booking configurations (2.12)
    v1Routes.use('/booking-configs', bookingConfigRoutes);

    // profile routes
    v1Routes.use('/profile', profileRoutes);

    // Notification Core Module Routes
    v1Routes.use('/notifications/categories', notificationCategoryRoutes);
    v1Routes.use('/notifications/templates', notificationTemplateRoutes);
    v1Routes.use('/notifications/role-configs', notificationRoleConfigRoutes);
    v1Routes.use('/notifications/inbox', userNotificationRoutes);

    // Patient Management (2.1)
    v1Routes.use('/patient/profiles', patientProfileRoutes);
    v1Routes.use('/patients', patientRoutes);

    // Medical History (2.2 )
    v1Routes.use('/medical-history', medicalHistoryRoutes);

    // Insurance Providers & Patient Insurances (2.3)
    v1Routes.use('/insurance-providers', insuranceProviderRoutes);
    v1Routes.use('/patient-insurances', patientInsuranceRoutes);
    v1Routes.use('/insurance-coverage', insuranceCoverageRoutes);

    // Patient Relations & Relation Types (2.4)
    v1Routes.use('/relation-types', relationTypeRoutes);
    v1Routes.use('/patient-relations', patientContactRoutes);

    // Document Types & Patient Documents (2.5)
    v1Routes.use('/document-types', documentTypeRoutes);
    v1Routes.use('/patient-documents', patientDocumentRoutes);

    // Patient Tags (2.6)
    v1Routes.use('/patient-tags', patientTagRoutes);

    // Classification Rules (2.6.5)
    v1Routes.use('/patient-classification-rules', classificationRuleRoutes);

    // Appointment Management (3.1)
    v1Routes.use('/appointments', appointmentRoutes);

    // Module 3.2 – Quản lý khung giờ & ca khám
    v1Routes.use('/facilities', consultationDurationRoutes);
    v1Routes.use('/locked-slots', lockedSlotRoutes);
    v1Routes.use('/shift-services', shiftServiceRoutes);

    // Module 3.3 – Quản lý lịch bác sĩ
    v1Routes.use('/doctor-availability', doctorAvailabilityRoutes);
    v1Routes.use('/doctor-absences', doctorAbsenceRoutes);

    // Module 3.4 – Quản lý phòng khám & tài nguyên
    v1Routes.use('/room-maintenance', roomMaintenanceRoutes);

    // Module 3.6 – Xác nhận & Nhắc lịch khám
    v1Routes.use('/appointment-confirmations', appointmentConfirmationRoutes);

    // Module 3.7 – Check-in & Trạng thái lịch khám
    v1Routes.use('/appointment-status', appointmentStatusRoutes);

    // Module 3.8 – Quản lý thay đổi & dời lịch
    v1Routes.use('/appointment-changes', appointmentChangeRoutes);

    // Module 3.9 – Điều phối & tối ưu lịch khám
    v1Routes.use('/appointment-coordination', appointmentCoordinationRoutes);

    // MODULE 4: KHÁM BỆNH & HỒ SƠ BỆNH ÁN (EMR)
    // Module 4.1 – Encounter Management
    v1Routes.use('/encounters', encounterRoutes);

    // Module 4.2 – Clinical Examination
    v1Routes.use('/clinical-examinations', clinicalExamRoutes);

    // Module 4.3 – Diagnosis Management
    v1Routes.use('/diagnoses', diagnosisRoutes);

    // Module 4.4 – Medical Orders (Chỉ định dịch vụ y tế)
    v1Routes.use('/medical-orders', medicalOrderRoutes);

    // Module 4.5 – Prescription Management (Kê đơn thuốc)
    v1Routes.use('/prescriptions', prescriptionRoutes);

    // Module 4.6 – Medical Records (Hồ sơ Bệnh án Điện tử)
    v1Routes.use('/medical-records', medicalRecordRoutes);

    // Module 4.7 – Treatment Progress (Theo dõi Tiến trình Điều trị)
    v1Routes.use('/treatment-plans', treatmentProgressRoutes);

    // Module 4.8 – Medical Sign-off (Ký số & Xác nhận Hồ sơ Y khoa)
    v1Routes.use('/sign-off', signOffRoutes);

    // ═══ MODULE 6: HỒ SƠ SỨC KHỎE ĐIỆN TỬ (EHR) ═══
    // Module 6.1 – Patient Health Profile (Hồ sơ sức khỏe tổng hợp)
    v1Routes.use('/ehr', healthProfileRoutes);

    // Module 6.2 – Health Timeline (Dòng thời gian sức khỏe)
    v1Routes.use('/ehr', healthTimelineRoutes);

    // Module 6.3 – Medical History & Risk Factors (Tiền sử bệnh & yếu tố nguy cơ)
    v1Routes.use('/ehr', medicalHistoryEhrRoutes);

    // Module 6.4 – Clinical Results (Kết quả xét nghiệm & cận lâm sàng)
    v1Routes.use('/ehr', clinicalResultsRoutes);

    // Module 6.5 – Medication & Treatment Records (Hồ sơ đơn thuốc & điều trị)
    v1Routes.use('/ehr', medicationTreatmentRoutes);

    // Module 6.6 – Vital Signs & Health Metrics (Chỉ số sức khỏe & sinh hiệu)
    v1Routes.use('/ehr', vitalSignsRoutes);

    // Module 6.8 – Data Integration (Đồng bộ dữ liệu & tích hợp bên ngoài)
    v1Routes.use('/ehr', dataIntegrationRoutes);

    // ═══ MODULE 9: THANH TOÁN (BILLING) ═══
    // Module 9.1 – Quản lý danh mục dịch vụ & bảng giá
    v1Routes.use('/billing/pricing', billingPricingRoutes);

    // Module 9.2 – Thu phí khám & dịch vụ y tế
    v1Routes.use('/billing', billingInvoiceRoutes);

    // Module 9.3 – Thanh toán trực tuyến (SePay)
    v1Routes.use('/billing/payments', billingPaymentGatewayRoutes);

    // Module 9.4 – Thanh toán tại quầy (Offline Payment)
    v1Routes.use('/billing', billingOfflinePaymentRoutes);

    // Module 9.5 – Quản lý hóa đơn & chứng từ thanh toán
    v1Routes.use('/billing', billingDocumentRoutes);

    // Module 9.6 – Đối soát & quyết toán thanh toán
    v1Routes.use('/billing', billingReconciliationRoutes);

    // Module 9.7 – Hoàn tiền & điều chỉnh giao dịch
    v1Routes.use('/billing', billingRefundRoutes);

    // Module 9.8 – Quản lý chính sách giá & ưu đãi
    v1Routes.use('/billing', billingPricingPolicyRoutes);

    // Module 9.9 – Quản lý phân quyền thu ngân
    v1Routes.use('/billing', billingCashierAuthRoutes);

    // Admin reporting
    v1Routes.use('/reports', reportsRoutes);

    // ═══ MODULE 8: KHÁM TỪ XA (REMOTE CONSULTATION) ═══
    // Module 8.1 – Quản lý hình thức khám từ xa
    v1Routes.use('/teleconsultation', teleConsultationTypeRoutes);
    // Module 8.2 – Đặt lịch tư vấn & khám từ xa
    v1Routes.use('/teleconsultation', teleBookingRoutes);
    // Module 8.3 – Phòng khám trực tuyến
    v1Routes.use('/teleconsultation', teleRoomRoutes);
    // Module 8.4 – Trao đổi thông tin y tế trực tuyến
    v1Routes.use('/teleconsultation', medicalChatRoutes);
    // Module 8.5 – Ghi nhận kết quả khám từ xa
    v1Routes.use('/teleconsultation', teleResultRoutes);
    // Module 8.6 – Kê đơn & chỉ định từ xa
    v1Routes.use('/teleconsultation', telePrescriptionRoutes);
    // Module 8.7 – Theo dõi sau tư vấn & tái khám
    v1Routes.use('/teleconsultation', teleFollowUpRoutes);
    // Module 8.8 – Quản lý chất lượng & đánh giá
    v1Routes.use('/teleconsultation', teleQualityRoutes);
    // Module 8.9 – Cấu hình & quản trị hệ thống
    v1Routes.use('/teleconsultation', teleConfigRoutes);

    // Webhook alias — Nginx strip /api/ nên SePay gọi /api/hooks/sepay-payment → Express nhận /hooks/sepay-payment
    app.use('/api/v1', v1Routes);
    app.use('/api', v1Routes);

    app.post('/hooks/sepay-payment', verifySepayWebhook, sepayWebhook);
}

