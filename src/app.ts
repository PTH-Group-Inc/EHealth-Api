import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import { initRoutes } from './routes/index.route'
import { SessionCleanup } from './jobs/SessionCleanup.jobs'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

initRoutes(app);

SessionCleanup.startSessionCleanupJob();

export default app