import { Router } from 'express'
import { validateAndSave, listSubmissions, getSubmission, statsSummary, saveFeedback } from '../controllers/submissions.js'

const router = Router()

router.get('/health', (req, res)=> res.json({ ok: true }))
router.post('/validate', validateAndSave)
router.get('/submissions', listSubmissions)
router.get('/submissions/:id', getSubmission)
router.put('/submissions/:id/feedback', saveFeedback)
router.get('/stats/summary', statsSummary)


// Quick write-test to ensure Mongo writes are succeeding
import Submission from '../models/Submission.js'
router.get('/debug/write-test', async (req, res) => {
  try {
    const doc = await Submission.create({
      source: 'DEBUG',
      tokens: [],
      errors: [],
      errorCount: 0,
      ok: true,
      meta: { ip: req.ip, ua: req.get('user-agent') || '' }
    })
    res.json({ ok: true, id: doc._id })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

export default router
