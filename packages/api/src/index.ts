import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESMで__dirnameを再現
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ルートディレクトリの.envを読み込む
config({ path: resolve(__dirname, '../../../.env') })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { rateLimit } from 'express-rate-limit'

import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'
import { usersRouter } from './routes/users'
import { categoriesRouter } from './routes/categories'
import { wantToDosRouter } from './routes/wantToDos'
import { recruitmentsRouter } from './routes/recruitments'
import { groupsRouter } from './routes/groups'
import { nearbyRouter } from './routes/nearby'
import { errorHandler } from './middlewares/errorHandler'
import { setupSocket } from './socket'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

// Routes
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/want-to-dos', wantToDosRouter)
app.use('/api/recruitments', recruitmentsRouter)
app.use('/api/groups', groupsRouter)
app.use('/api/nearby', nearbyRouter)

// Error handler
app.use(errorHandler)

// Socket.io
setupSocket(io)

// Start server
const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export { app, io }
