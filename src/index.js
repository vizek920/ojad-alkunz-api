// ojad-alkunz-api / src/index.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');

const authRouter      = require('./routes/auth');
const sessionsRouter  = require('./routes/sessions');
const questionsRouter = require('./routes/questions');
const categoriesRouter = require('./routes/categories');
const viewersRouter   = require('./routes/viewers');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cleanup-secret'],
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/sessions',   sessionsRouter);
app.use('/api/questions',  questionsRouter);
app.use('/api/categories', categoriesRouter);

// Viewers are nested under sessions: /api/sessions/:id/viewers
// sessions.js handles /api/sessions/:id/viewers/* via viewersRouter
// We mount viewersRouter inside sessionsRouter using mergeParams
// But since sessions.js already exports its own router, we re-mount here:
app.use('/api/sessions/:id/viewers', viewersRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
