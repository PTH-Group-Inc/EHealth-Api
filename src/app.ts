import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import { initRoutes } from './routes/index.route'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

initRoutes(app);

export default app