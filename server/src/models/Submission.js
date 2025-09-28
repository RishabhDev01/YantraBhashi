import mongoose from 'mongoose'

const ErrorSchema = new mongoose.Schema({
  msg: String,
  line: Number,
  col: Number
}, { _id: false })

const TokenSchema = new mongoose.Schema({
  type: String,
  value: String,
  line: Number,
  col: Number
}, { _id: false })

const SubmissionSchema = new mongoose.Schema({
  source: { type: String, required: true },
  tokens: [TokenSchema],
  errors: [ErrorSchema],
  username: String,
  feedback: String,
  errorCount: { type: Number, required: true },
  ok: { type: Boolean, required: true },
  meta: {
    ip: String,
    ua: String,
    userId: String
  }
}, { timestamps: true })

export default mongoose.model('Submission', SubmissionSchema)
