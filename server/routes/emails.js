import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { sendEmails, sendToUnsent } from '../services/emailService.js';

const router = Router();

// ── SSE client management ──────────────────────────────────────────────────────
/** @type {Set<import('express').Response>} */
const sseClients = new Set();

/**
 * Broadcast a progress event to every connected SSE client.
 */
function broadcast(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// ── GET /progress — SSE endpoint ───────────────────────────────────────────────
router.get('/progress', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Send an initial comment so the client knows the connection is alive
  res.write(': connected\n\n');

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ── POST /send — Kick off the email sending job ────────────────────────────────
router.post('/send', (req, res) => {
  const { recruiterIds, sendUnsent: sendUnsentFlag, templateId } = req.body;

  if (!recruiterIds && !sendUnsentFlag) {
    return res.status(400).json({
      error: 'Provide either recruiterIds (number[]) or sendUnsent: true.',
    });
  }

  const jobId = randomUUID();

  // Respond immediately — the heavy work runs in the background
  res.json({ message: 'Email job started.', jobId });

  // SSE callback pushed to every connected client
  const sseCallback = (progress) => {
    broadcast('progress', { jobId, ...progress });
  };

  // Fire-and-forget (errors are logged, not thrown to the client)
  const work = sendUnsentFlag
    ? sendToUnsent(templateId || null, sseCallback)
    : sendEmails(recruiterIds, templateId || null, sseCallback);

  work
    .then((result) => {
      broadcast('complete', { jobId, ...result });
    })
    .catch((err) => {
      broadcast('error', { jobId, error: err.message });
    });
});

// ── GET /history — Paginated email logs ────────────────────────────────────────
router.get('/history', (req, res) => {
  try {
    const status = req.query.status || null;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];

    if (status) {
      where = 'WHERE el.status = ?';
      params.push(status);
    }

    const countRow = db.prepare(
      `SELECT COUNT(*) AS total FROM email_logs el ${where}`
    ).get(...params);

    const data = db.prepare(
      `SELECT el.*, r.name AS recruiter_name, r.company AS recruiter_company, r.email AS recruiter_email
       FROM email_logs el
       LEFT JOIN recruiters r ON r.id = el.recruiter_id
       ${where}
       ORDER BY el.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({
      data,
      total: countRow.total,
      page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /stats — Dashboard statistics ──────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const totalRecruiters =
      db.prepare('SELECT COUNT(*) AS cnt FROM recruiters').get().cnt;
    const totalSent =
      db.prepare("SELECT COUNT(*) AS cnt FROM email_logs WHERE status = 'sent'").get().cnt;
    const totalFailed =
      db.prepare("SELECT COUNT(*) AS cnt FROM email_logs WHERE status = 'failed'").get().cnt;
    const totalPending =
      db.prepare("SELECT COUNT(*) AS cnt FROM email_logs WHERE status = 'pending'").get().cnt;

    res.json({ totalRecruiters, totalSent, totalFailed, totalPending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
