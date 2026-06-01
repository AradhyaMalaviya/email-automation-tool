import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ── GET / — List all templates ─────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const templates = db.prepare(
      'SELECT * FROM templates ORDER BY created_at DESC'
    ).all();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /:id — Get a single template ───────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(
      req.params.id
    );
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST / — Create a new template ─────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { name, subject, html_body } = req.body;

    if (!name || !subject || !html_body) {
      return res
        .status(400)
        .json({ error: 'name, subject, and html_body are all required.' });
    }

    const result = db.prepare(
      'INSERT INTO templates (name, subject, html_body) VALUES (?, ?, ?)'
    ).run(name, subject, html_body);

    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(
      result.lastInsertRowid
    );
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /:id — Update a template ───────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(
      req.params.id
    );
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    const { name, subject, html_body, is_default } = req.body;

    // If this template is being set as default, clear the flag on all others
    const update = db.transaction(() => {
      if (is_default) {
        db.prepare('UPDATE templates SET is_default = 0').run();
      }

      db.prepare(
        `UPDATE templates
         SET name = ?, subject = ?, html_body = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        name ?? existing.name,
        subject ?? existing.subject,
        html_body ?? existing.html_body,
        is_default !== undefined ? (is_default ? 1 : 0) : existing.is_default,
        req.params.id
      );
    });
    update();

    const updated = db.prepare('SELECT * FROM templates WHERE id = ?').get(
      req.params.id
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /:id — Delete a template ────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(
      req.params.id
    );
    if (!existing) return res.status(404).json({ error: 'Template not found' });

    // Prevent deletion of the default template
    if (existing.is_default) {
      return res.status(400).json({
        error: 'Cannot delete the default template. Set another template as default first.',
      });
    }

    // Prevent deletion of the last remaining template
    const count = db.prepare('SELECT COUNT(*) AS cnt FROM templates').get().cnt;
    if (count <= 1) {
      return res.status(400).json({
        error: 'Cannot delete the only remaining template.',
      });
    }

    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Template deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
