import { Express } from 'express'
import productRouter from './testProduct.route';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import facilityRoutes from './facility.routes';
import permissionRoutes from './permission.routes';
import moduleRoutes from './module.routes';
import menuRoutes from './menu.routes';
import apiPermissionRoutes from './api-permission.routes';

export const initRoutes = (app: Express) => {
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

    //permissions routes
    app.use('/api/permissions', permissionRoutes);

    // feature modules routes
    app.use('/api/modules', moduleRoutes);

    // system menus routes
    app.use('/api/menus', menuRoutes);

    // api permission settings wrapper
    app.use('/api/api-permissions', apiPermissionRoutes);
}
