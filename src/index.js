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

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.FRONTEND_URL,          // e.g. https://ojad-alkunz.vercel.app
      'https://ojad-alkunz.vercel.app',  // fallback hardcoded
    ].filter(Boolean);

    // Allow any *.vercel.app subdomain (covers preview deployments)
    if (
      origin.endsWith('.vercel.app') ||
      allowed.includes(origin)
    ) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cleanup-secret'],
  credentials: true,
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/sessions',   sessionsRouter);
app.use('/api/questions',  questionsRouter);
app.use('/api/categories', categoriesRouter);

// Viewers nested under sessions: /api/sessions/:id/viewers
app.use('/api/sessions/:id/viewers', viewersRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
