import { Express,  } from 'express'
import productRouter from './testProduct.route'

export const initRoutes = (app: Express) => {
    //test product routes
    app.use('/api/test', productRouter)
}
