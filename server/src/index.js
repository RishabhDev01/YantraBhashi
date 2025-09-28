import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import mongoose from 'mongoose'
import { connectDB } from './lib/db.js'
import 'dotenv/config'
import router from './routes/index.js'

const app = express()
const PORT = process.env.PORT || 4000
const ORIGIN = process.env.CORS_ORIGIN || '*'
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yantrabhashi'

app.use(cors({ origin: ORIGIN }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.use('/api', router)

mongoose.set('strictQuery', true)
mongoose.connect(MONGO_URI).then(()=>{
  console.log('[mongo] connected')
  app.listen(PORT, ()=> console.log(`[server] http://localhost:${PORT}`))
}).catch(err=>{
  console.error('Mongo connection error:', err.message)
  process.exit(1)
})
