import { Express, } from 'express'
import productRouter from './testProduct.route';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

export const initRoutes = (app: Express) => {
    //test product routes
    app.use('/api/test', productRouter)

    //auth routes
    app.use('/api/auth', authRoutes);

    //user management routes
    app.use('/api/users', userRoutes);
}
