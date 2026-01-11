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
import { notificationsRouter } from './routes/notifications'
import { errorHandler } from './middlewares/errorHandler'
import { setupSocket } from './socket'
import { startScheduler } from './services/schedulerService'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true)
        return
      }
      if (
        origin.includes('vercel.app') ||
        origin.includes('localhost') ||
        origin === process.env.FRONTEND_URL
      ) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// CORS設定
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // originがない場合（サーバー間通信など）は許可
    if (!origin) {
      callback(null, true)
      return
    }
    // 許可リストに含まれているか、VercelのプレビューURLかチェック
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('vercel.app') ||
      origin.includes('localhost')
    ) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}

// Middleware
// CORSを最初に設定（preflightリクエスト対応）
app.use(cors(corsOptions))
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
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
app.use('/api/notifications', notificationsRouter)

// Error handler
app.use(errorHandler)

// Socket.io
setupSocket(io)

// Start server
const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)

  // スケジューラーを開始（期限切れ募集の自動締め切りなど）
  // TODO: DB接続が安定したら有効化する
  // startScheduler()
})

export { app, io }
