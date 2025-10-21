import 'dotenv/config'
import express from 'express'
// Use require-typed import to work around missing type decls in some environments
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors') as (options?: any) => import('express').RequestHandler
import cookieParser from 'cookie-parser'
import { router as healthRouter } from './routes/health'
import { router as authRouter } from './routes/auth'
import { router as subjectsRouter } from './routes/subjects'
import { router as resourcesRouter } from './routes/resources'

const app = express()

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

app.use(cors({ origin: ORIGIN, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Routes
app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/subjects', subjectsRouter)
app.use('/resources', resourcesRouter)

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
