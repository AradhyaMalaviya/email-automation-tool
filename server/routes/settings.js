import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const router = Router();

// ── Multer setup — store files in server/uploads/ with original filename ───────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ── GET / — Return all settings as a { key: value } object ────────────────────
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT / — Bulk-update settings ───────────────────────────────────────────────
router.put('/', (req, res) => {
  try {
    const entries = Object.entries(req.body);
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No settings provided.' });
    }

    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    const updateAll = db.transaction(() => {
      for (const [key, value] of entries) {
        upsert.run(key, String(value));
      }
    });
    updateAll();

    // Return the updated settings
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /resume — Upload a resume PDF ─────────────────────────────────────────
router.post('/resume', upload.single('resume'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const filename = req.file.originalname;

    // Persist the filename in settings
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('resume_filename', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(filename);

    res.json({ filename, message: 'Resume uploaded successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
