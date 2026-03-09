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
import medicalServiceRoutes from './Core/medical-service.routes';
import profileRoutes from './Core/profile.routes';
import notificationCategoryRoutes from './Core/notification-category.routes';
import notificationTemplateRoutes from './Core/notification-template.routes';
import notificationRoleConfigRoutes from './Core/notification-role-config.routes';
import userNotificationRoutes from './Core/user-notification.routes';
import staffRoutes from './Facility Management/staff.routes';
import shiftRoutes from './Facility Management/shift.routes';
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

    // profile routes
    app.use('/api/profile', profileRoutes);

    // 1.7 Notification Core Module Routes
    app.use('/api/notifications/categories', notificationCategoryRoutes);
    app.use('/api/notifications/templates', notificationTemplateRoutes);
    app.use('/api/notifications/role-configs', notificationRoleConfigRoutes);
    app.use('/api/notifications/inbox', userNotificationRoutes);
}
