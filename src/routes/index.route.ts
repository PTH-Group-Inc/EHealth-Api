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
import pharmacyRoutes from './Core/pharmacy.routes';
import medicalServiceRoutes from './Facility Management/medical-service.routes';
import specialtyServiceRoutes from './Facility Management/specialty-service.routes';
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
import { medicalHistoryRoutes } from './Patient Management/medical-history.routes';
import { auditMiddleware } from '../middleware/audit.middleware';

export const initRoutes = (app: Express) => {
    // Audit Middleware
    app.use(auditMiddleware);

    //test product routes
    app.use('/api/test', productRouter)

    //auth routes
    app.use('/api/auth', authRoutes);

    //user management routes
    app.use('/api/users', userRoutes);

    //medical staff management routes
    app.use('/api/staff', staffRoutes);

    //shift management routes
    app.use('/api/shifts', shiftRoutes);

    //appointment slot routes
    app.use('/api/slots', slotRoutes);

    //staff schedule routes
    app.use('/api/staff-schedules', staffScheduleRoutes);

    //leave management routes
    app.use('/api/leaves', leaveRoutes);

    //shift swap routes
    app.use('/api/shift-swaps', shiftSwapRoutes);

    //license management routes
    app.use('/api/licenses', licenseRoutes);

    //operating hours management routes
    app.use('/api/operating-hours', operatingHourRoutes);

    //closed days management routes
    app.use('/api/closed-days', closedDayRoutes);

    //holidays management routes
    app.use('/api/holidays', holidayRoutes);

    //facility status & calendar routes
    app.use('/api/facility-status', facilityStatusRoutes);

    //role dropdowns routes
    app.use('/api/roles', roleRoutes);

    //facility dropdown routes
    app.use('/api/facilities', facilityRoutes);

    //branch management routes
    app.use('/api/branches', branchRoutes);

    //department management routes
    app.use('/api/departments', departmentRoutes);

    //medical rooms management routes
    app.use('/api/medical-rooms', medicalRoomRoutes);

    //permissions routes
    app.use('/api/permissions', permissionRoutes);

    // feature modules routes
    app.use('/api/modules', moduleRoutes);

    // system menus routes
    app.use('/api/menus', menuRoutes);

    // api permission settings
    app.use('/api/api-permissions', apiPermissionRoutes);

    // system settings routes
    app.use('/api/system', systemRoutes);

    // specialty routes
    app.use('/api/specialties', specialtyRouter);

    // master data routes
    app.use('/api/master-data', masterDataRoutes);

    // pharmacy routes
    app.use('/api/pharmacy', pharmacyRoutes);

    // medical services
    app.use('/api/medical-services', medicalServiceRoutes);

    // specialty-service mapping (2.9.1)
    app.use('/api/specialty-services', specialtyServiceRoutes);

    // doctor-service mapping (2.9.2)
    app.use('/api/doctor-services', doctorServiceRoutes);

    // medical equipment management (2.10)
    app.use('/api/equipments', medicalEquipmentRoutes);

    // bed management (2.11)
    app.use('/api/beds', bedRoutes);

    // booking configurations (2.12)
    app.use('/api/booking-configs', bookingConfigRoutes);

    // profile routes
    app.use('/api/profile', profileRoutes);

    // Notification Core Module Routes
    app.use('/api/notifications/categories', notificationCategoryRoutes);
    app.use('/api/notifications/templates', notificationTemplateRoutes);
    app.use('/api/notifications/role-configs', notificationRoleConfigRoutes);
    app.use('/api/notifications/inbox', userNotificationRoutes);

    // Patient Management (2.1)
    app.use('/api/patients', patientRoutes);

    // Medical History (2.2 - Read-Only)
    app.use('/api/medical-history', medicalHistoryRoutes);
}

