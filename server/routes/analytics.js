import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/analytics
router.get('/', (req, res) => {
  try {
    // 1. Timeline Data: Count sent emails by date (last 30 days)
    const timelineQuery = db.prepare(`
      SELECT DATE(sent_at) as date, COUNT(*) as count 
      FROM email_logs 
      WHERE status = 'sent' AND sent_at IS NOT NULL
      GROUP BY DATE(sent_at)
      ORDER BY date ASC
    `);
    const timelineData = timelineQuery.all();

    // 2. Status Breakdown: Count of emails by status
    const statusQuery = db.prepare(`
      SELECT status as name, COUNT(*) as value 
      FROM email_logs 
      GROUP BY status
    `);
    const statusData = statusQuery.all();

    // 3. Top Templates: Usage count per template
    const templatesQuery = db.prepare(`
      SELECT t.name, COUNT(e.id) as count
      FROM email_logs e
      JOIN templates t ON e.template_id = t.id
      GROUP BY t.id
      ORDER BY count DESC
      LIMIT 5
    `);
    const topTemplates = templatesQuery.all();

    res.json({
      timeline: timelineData,
      statusBreakdown: statusData,
      topTemplates: topTemplates
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
