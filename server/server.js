import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables before anything else
dotenv.config();

// Importing db triggers table creation & seeding
import './db.js';

// Route imports
import recruitersRouter from './routes/recruiters.js';
import emailsRouter from './routes/emails.js';
import templatesRouter from './routes/templates.js';
import settingsRouter from './routes/settings.js';
import analyticsRouter from './routes/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded files (resumes, etc.)
app.use('/uploads', express.static(uploadsDir));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/recruiters', recruitersRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/analytics', analyticsRouter);

// ── Production: serve built client ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
