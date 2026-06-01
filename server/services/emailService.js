import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(serverDir, 'uploads');

/**
 * Creates and returns the nodemailer transporter configured for Gmail.
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.Email,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Resolve the full path for the resume file.
 * Prefers the uploads/ directory; falls back to the server root.
 */
function getResumePath(filename) {
  const uploadsPath = path.join(uploadsDir, filename);
  if (fs.existsSync(uploadsPath)) return uploadsPath;

  const rootPath = path.join(serverDir, filename);
  if (fs.existsSync(rootPath)) return rootPath;

  return null;
}

/**
 * Load all settings as a plain { key: value } object.
 */
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

/**
 * Replace {name} and {company} placeholders in a string.
 */
function replacePlaceholders(text, recruiter) {
  return text
    .replace(/\{name\}/gi, recruiter.name)
    .replace(/\{company\}/gi, recruiter.company);
}

/**
 * Sleep helper.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send emails to the specified recruiter IDs using the given template.
 *
 * @param {number[]} recruiterIds - Array of recruiter row IDs.
 * @param {number|null} templateId - Template ID to use, or null for default.
 * @param {function} sseCallback - Called with progress objects after each send.
 * @returns {Promise<{ sent: number, failed: number, total: number }>}
 */
export async function sendEmails(recruiterIds, templateId, sseCallback) {
  const transporter = createTransporter();
  const settings = getSettings();
  const delayMs = parseInt(settings.delay_ms, 10) || 60000;
  const senderName = settings.sender_name || 'Aaradhya Malaviya';
  const resumeFilename = settings.resume_filename || '';

  // Fetch template ──────────────────────────────────────────────────────────
  let template;
  if (templateId) {
    template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);
  }
  if (!template) {
    template = db.prepare('SELECT * FROM templates WHERE is_default = 1').get();
  }
  if (!template) {
    template = db.prepare('SELECT * FROM templates ORDER BY id ASC LIMIT 1').get();
  }
  if (!template) {
    throw new Error('No email template found. Please create one first.');
  }

  // Fetch recruiters ────────────────────────────────────────────────────────
  const placeholders = recruiterIds.map(() => '?').join(',');
  const recruiters = db.prepare(
    `SELECT * FROM recruiters WHERE id IN (${placeholders})`
  ).all(...recruiterIds);

  const total = recruiters.length;
  let sent = 0;
  let failed = 0;

  // Resolve resume attachment ───────────────────────────────────────────────
  const resumePath = resumeFilename ? getResumePath(resumeFilename) : null;
  const attachments = resumePath
    ? [{ filename: resumeFilename.replace(/\s*\(\d+\)/, ''), path: resumePath }]
    : [];

  // Send loop ───────────────────────────────────────────────────────────────
  const insertLog = db.prepare(
    `INSERT INTO email_logs (recruiter_id, template_id, subject, status, error_message, sent_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (let i = 0; i < recruiters.length; i++) {
    const recruiter = recruiters[i];
    const subject = replacePlaceholders(template.subject, recruiter);
    const html = replacePlaceholders(template.html_body, recruiter);
    let status = 'sent';
    let errorMsg = null;

    try {
      await transporter.sendMail({
        from: `"${senderName}" <${process.env.Email}>`,
        to: recruiter.email,
        subject,
        html,
        attachments,
      });
      sent++;
    } catch (err) {
      status = 'failed';
      errorMsg = err.message;
      failed++;
    }

    insertLog.run(
      recruiter.id,
      template.id,
      subject,
      status,
      errorMsg,
      status === 'sent' ? new Date().toISOString() : null
    );

    if (typeof sseCallback === 'function') {
      sseCallback({
        current: i + 1,
        total,
        recruiterEmail: recruiter.email,
        status,
        error: errorMsg,
      });
    }

    // Wait between sends (skip delay after the last email)
    if (i < recruiters.length - 1) {
      await sleep(delayMs);
    }
  }

  return { sent, failed, total };
}

/**
 * Find all recruiters who have never received a 'sent' email and send to them.
 */
export async function sendToUnsent(templateId, sseCallback) {
  const rows = db.prepare(
    `SELECT r.id FROM recruiters r
     WHERE r.id NOT IN (
       SELECT DISTINCT recruiter_id FROM email_logs WHERE status = 'sent'
     )`
  ).all();

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }
  return sendEmails(ids, templateId, sseCallback);
}
