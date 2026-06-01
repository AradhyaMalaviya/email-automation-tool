import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create tables ──────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS recruiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recruiter_id INTEGER NOT NULL,
    template_id INTEGER,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
    FOREIGN KEY (template_id) REFERENCES templates(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ── Seed default settings ──────────────────────────────────────────────────────

const insertSetting = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);

const seedSettings = db.transaction(() => {
  insertSetting.run('delay_ms', '60000');
  insertSetting.run('sender_name', 'Aaradhya Malaviya');
  insertSetting.run('resume_filename', 'Aaradhya_Malaviya_Resume (1).pdf');
});

seedSettings();

// ── Seed default email template ────────────────────────────────────────────────

const templateCount = db.prepare('SELECT COUNT(*) AS cnt FROM templates').get();

if (templateCount.cnt === 0) {
  const defaultHtml = `<p>Hi {name},</p>

<p>
  I'm Aaradhya Malaviya, and I've attached my resume to apply for an internship role at your company. 
  I am a passionate software developer with a strong drive to build meaningful projects and solve real-world problems.
</p>

<p>
  I'm currently looking for an internship opportunity at <b>{company}</b> where I can contribute from day one and continue learning in a fast-paced environment.
</p>

<p>
  I've attached my resume for your review. I'd really appreciate the opportunity to connect and explore if there's a fit.
</p>

<p>
  Thank you for your time.<br/><br/>
  Aaradhya Malaviya<br/>
  Phone: 9260940347<br/>
  LinkedIn: https://www.linkedin.com/in/aradhya-malaviya-26bb31303/<br/>
  GitHub: https://github.com/AradhyaMalaviya
</p>`;

  db.prepare(
    `INSERT INTO templates (name, subject, html_body, is_default)
     VALUES (?, ?, ?, 1)`
  ).run(
    'Default Internship Application',
    'Internship Application at {company}',
    defaultHtml
  );
}

export default db;
