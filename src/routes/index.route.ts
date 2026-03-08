import { Express } from 'express'
import productRouter from './testProduct.route';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import facilityRoutes from './facility.routes';
import branchRoutes from './branch.routes';
import departmentRoutes from './department.routes';
import medicalRoomRoutes from './medical-room.routes';
import permissionRoutes from './permission.routes';
import moduleRoutes from './module.routes';
import menuRoutes from './menu.routes';
import apiPermissionRoutes from './api-permission.routes';
import systemRoutes from './system.routes';
import specialtyRouter from './specialty.route';
import masterDataRoutes from './master-data.routes';
import pharmacyRoutes from './pharmacy.routes';
import medicalServiceRoutes from './medical-service.routes';
import profileRoutes from './profile.routes';
import notificationCategoryRoutes from './notification-category.routes';
import notificationTemplateRoutes from './notification-template.routes';
import notificationRoleConfigRoutes from './notification-role-config.routes';
import userNotificationRoutes from './user-notification.routes';
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
