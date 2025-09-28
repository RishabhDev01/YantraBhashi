import mongoose from 'mongoose'

export async function connectDB(uri) {
  const U = uri || 'mongodb://localhost:27017/yantrabhashi'
  mongoose.set('strictQuery', true)

  // Helpful debug logs
  mongoose.connection.on('connected', () => {
    console.log('[mongo] connected ->', U)
  })
  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected')
  })

  // Keep trying to connect until success (useful if Mongo starts a bit late)
  let attempts = 0
  while (true) {
    try {
      attempts++
      await mongoose.connect(U, { serverSelectionTimeoutMS: 5000 })
      return mongoose
    } catch (e) {
      console.error(`[mongo] attempt ${attempts} failed:`, e.message)
      if (attempts >= 3) { throw e }
      await new Promise(r => setTimeout(r, 1500))
    }
  }
}
