import Submission from '../models/Submission.js'
// import { runValidation } from '../lib/validator.js'

export async function validateAndSave(req, res) {
  try {
    const { source, userId, username } = req.body || {}
    if (typeof source !== 'string' || source.trim().length === 0) {
      return res.status(400).json({ error: 'source is required' })
    }

    // const { tokens, errors } = runValidation(source)
    const {tokens, errors} = req.body.result;
    console.log("******************")
    console.log(req.body);
    console.log("******************")
    const doc = await Submission.create({
      source,
      tokens,
      errors,
      username: req.body.username,
      errorCount: errors.length,
      ok: errors.length === 0,
      meta: {
        ip: req.ip,
        ua: req.get('user-agent') || '',
        userId: userId || null
      }
    })

    console.log('#############')
    console.log(doc);
    console.log('#############')

    res.json({ id: doc._id, ok: doc.ok, errorCount: doc.errorCount, tokens, errors, createdAt: doc.createdAt })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}

export async function listSubmissions(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100)
    const skip = Math.max(parseInt(req.query.skip || '0', 10), 0)
    const docs = await Submission.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    const total = await Submission.countDocuments({})
    res.json({ total, skip, limit, items: docs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}

export async function getSubmission(req, res) {
  try {
    const { id } = req.params
    const doc = await Submission.findById(id).lean()
    if (!doc) return res.status(404).json({ error: 'not_found' })
    res.json(doc)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}

export async function saveFeedback(req, res) {
  const data = req.body;
  const id = req.params.id;
  if (!data || typeof data.feedback !== 'string') {
    return res.status(400).json({ error: 'Invalid feedback data' });
  }

  const submission = await Submission.findById(id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  submission.feedback = data.feedback;
  await submission.save();
  res.json({ ok: true, message: 'Feedback saved successfully' });
}

export async function statsSummary(req, res) {
  try {
    const total = await Submission.countDocuments({})
    const ok = await Submission.countDocuments({ ok: true })
    const errorBuckets = await Submission.aggregate([
      { $unwind: "$errors" },
      { $group: { _id: "$errors.msg", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    res.json({ total, ok, errorRate: total ? (1 - ok/total) : 0, topErrors: errorBuckets })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}
