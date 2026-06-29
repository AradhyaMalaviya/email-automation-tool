import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import db from '../db.js';

const router = Router();

// ── Multer setup for CSV import ────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// ── GET / — List all recruiters (optional ?search=) ────────────────────────────
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    let recruiters;

    if (search) {
      const pattern = `%${search}%`;
      recruiters = db.prepare(
        `SELECT r.*, 
                EXISTS (
                  SELECT 1 FROM email_logs el 
                  WHERE el.recruiter_id = r.id AND el.status = 'sent'
                ) AS emailed
         FROM recruiters r
         WHERE r.name LIKE ? OR r.company LIKE ? OR r.email LIKE ?
         ORDER BY r.created_at DESC`
      ).all(pattern, pattern, pattern);
    } else {
      recruiters = db.prepare(
        `SELECT r.*, 
                EXISTS (
                  SELECT 1 FROM email_logs el 
                  WHERE el.recruiter_id = r.id AND el.status = 'sent'
                ) AS emailed
         FROM recruiters r
         ORDER BY r.created_at DESC`
      ).all();
    }

    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /export — Download all recruiters as CSV ───────────────────────────────
// NOTE: This must be declared BEFORE /:id so Express doesn't treat "export" as an id.
router.get('/export', (req, res) => {
  try {
    const recruiters = db.prepare(
      'SELECT name, company, email FROM recruiters ORDER BY id ASC'
    ).all();

    const header = 'Name,Company,Email\n';
    const rows = recruiters
      .map((r) => `"${r.name}","${r.company}","${r.email}"`)
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="recruiters.csv"');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /:id — Get a single recruiter ──────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const recruiter = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(
      req.params.id
    );
    if (!recruiter) return res.status(404).json({ error: 'Recruiter not found' });
    res.json(recruiter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST / — Create a recruiter ────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, company, email } = req.body;
    if (!name || !company || !email) {
      return res
        .status(400)
        .json({ error: 'name, company, and email are all required.' });
    }

    const result = db.prepare(
      'INSERT INTO recruiters (name, company, email) VALUES (?, ?, ?)'
    ).run(name, company, email);

    const recruiter = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(
      result.lastInsertRowid
    );
    res.status(201).json(recruiter);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res
        .status(409)
        .json({ error: 'A recruiter with this email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /:id — Update a recruiter ──────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const { name, company, email } = req.body;
    const existing = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(
      req.params.id
    );
    if (!existing) return res.status(404).json({ error: 'Recruiter not found' });

    db.prepare(
      `UPDATE recruiters
       SET name = ?, company = ?, email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      name ?? existing.name,
      company ?? existing.company,
      email ?? existing.email,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(
      req.params.id
    );
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res
        .status(409)
        .json({ error: 'A recruiter with this email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /:id — Delete a recruiter and their email logs ──────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM recruiters WHERE id = ?').get(
      req.params.id
    );
    if (!existing) return res.status(404).json({ error: 'Recruiter not found' });

    const deleteAll = db.transaction(() => {
      db.prepare('DELETE FROM email_logs WHERE recruiter_id = ?').run(
        req.params.id
      );
      db.prepare('DELETE FROM recruiters WHERE id = ?').run(req.params.id);
    });
    deleteAll();

    res.json({ message: 'Recruiter deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /import — Import recruiters from an uploaded CSV ──────────────────────
router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded.' });
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', () => {
      let imported = 0;
      let skipped = 0;
      const errors = [];

      const insert = db.prepare(
        'INSERT INTO recruiters (name, company, email) VALUES (?, ?, ?)'
      );

      for (const row of results) {
        // Normalise common CSV header variations (including case & BOM)
        let name = '';
        let company = '';
        let email = '';
        for (const key of Object.keys(row)) {
          const normKey = key.replace(/^\uFEFF/, '').toLowerCase().trim();
          if (normKey === 'name') name = row[key];
          else if (normKey === 'company') company = row[key];
          else if (normKey === 'email') email = row[key];
        }

        if (!name || !company || !email) {
          errors.push({ row, reason: 'Missing required fields' });
          continue;
        }

        try {
          insert.run(String(name).trim(), String(company).trim(), String(email).trim());
          imported++;
        } catch (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            skipped++;
          } else {
            errors.push({ row, reason: err.message });
          }
        }
      }

      res.json({ imported, skipped, errors });
    })
    .on('error', (err) => {
      res.status(500).json({ error: `CSV parsing error: ${err.message}` });
    });
});

export default router;
