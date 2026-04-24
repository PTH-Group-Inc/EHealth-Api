import { Router } from 'express';
import productRouter from './testProduct.route';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';
import moduleRoutes from './module.routes';
import menuRoutes from './menu.routes';
import apiPermissionRoutes from './api-permission.routes';
import systemRoutes from './system.routes';
import masterDataRoutes from './master-data.routes';
import profileRoutes from './profile.routes';
import notificationCategoryRoutes from './notification-category.routes';
import notificationTemplateRoutes from './notification-template.routes';
import notificationRoleConfigRoutes from './notification-role-config.routes';
import userNotificationRoutes from './user-notification.routes';

const router = Router();

//test product routes
router.use('/test', productRouter);

//auth routes
router.use('/auth', authRoutes);

//user management routes
router.use('/users', userRoutes);

//role dropdowns routes
router.use('/roles', roleRoutes);

//permissions routes
router.use('/permissions', permissionRoutes);

// feature modules routes
router.use('/modules', moduleRoutes);

// system menus routes
router.use('/menus', menuRoutes);

// api permission settings
router.use('/api-permissions', apiPermissionRoutes);

// system settings routes
router.use('/system', systemRoutes);

// master data routes
router.use('/master-data', masterDataRoutes);

// profile routes
router.use('/profile', profileRoutes);

// Notification Core Module Routes
router.use('/notifications/categories', notificationCategoryRoutes);
router.use('/notifications/templates', notificationTemplateRoutes);
router.use('/notifications/role-configs', notificationRoleConfigRoutes);
router.use('/notifications/inbox', userNotificationRoutes);

export default router;
