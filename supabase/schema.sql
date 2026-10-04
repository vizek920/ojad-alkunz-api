-- ═══════════════════════════════════════════════════════════════
--  اوجد الكنز — Supabase Schema
--  Run this once in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar    TEXT NOT NULL,
  name_en    TEXT,
  icon       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name_ar, name_en, icon) VALUES
  ('جغرافيا',    'Geography',      '🌍'),
  ('علوم',       'Science',        '🔬'),
  ('رياضة',      'Sports',         '⚽'),
  ('تاريخ',      'History',        '📜'),
  ('ثقافة عامة', 'General Culture', '🧠'),
  ('دين',        'Religion',        '☪️'),
  ('فن وموسيقى', 'Arts & Music',    '🎨'),
  ('تقنية',      'Technology',      '💻'),
  ('طبيعة',      'Nature',          '🌿'),
  ('رياضيات',    'Mathematics',     '➗')
ON CONFLICT DO NOTHING;

-- ── Questions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('mcq', 'tf')),
  options        JSONB,           -- ["option A", "option B", ...]
  correct_answer TEXT NOT NULL,
  difficulty     TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points         INT  NOT NULL DEFAULT 1,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  stage          INT  CHECK (stage BETWEEN 1 AND 15),  -- optional stage assignment
  hint           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_category  ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_stage     ON questions(stage);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- ── Sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name           TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'waiting'
                         CHECK (status IN ('waiting', 'active', 'finished')),
  total_stages         INT  NOT NULL DEFAULT 15,
  current_stage        INT  NOT NULL DEFAULT 1,
  current_turn         TEXT NOT NULL DEFAULT 'team1'
                         CHECK (current_turn IN ('team1', 'team2')),
  current_question_id  UUID REFERENCES questions(id) ON DELETE SET NULL,
  show_question        BOOLEAN DEFAULT FALSE,
  show_answer          BOOLEAN DEFAULT FALSE,
  timer_seconds        INT DEFAULT 30,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Session Teams ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_teams (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  team_key   TEXT NOT NULL CHECK (team_key IN ('team1', 'team2')),
  name       TEXT NOT NULL,
  score      INT  NOT NULL DEFAULT 0,
  lives      INT  NOT NULL DEFAULT 2,
  UNIQUE (session_id, team_key)
);

-- ── Session Stages ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_stages (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id         UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  stage_number       INT  NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'active', 'finished')),
  team1_stage_score  INT  DEFAULT 0,
  team2_stage_score  INT  DEFAULT 0,
  team1_lives        INT  DEFAULT 2,
  team2_lives        INT  DEFAULT 2,
  team1_used_double  BOOLEAN DEFAULT FALSE,
  team2_used_double  BOOLEAN DEFAULT FALSE,
  winner             TEXT CHECK (winner IN ('team1', 'team2', 'draw', NULL)),
  treasure_icon      TEXT,
  treasure_name      TEXT,
  treasure_desc      TEXT,
  UNIQUE (session_id, stage_number)
);

-- ── Enable Realtime ──────────────────────────────────────────
-- Run these in the Supabase Realtime settings OR via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE session_stages;

-- ── Row Level Security ───────────────────────────────────────
-- categories: public read, service role write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories"  ON categories FOR SELECT USING (true);
CREATE POLICY "service write categories" ON categories FOR ALL USING (auth.role() = 'service_role');

-- questions: public read, service role write
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read questions"  ON questions FOR SELECT USING (true);
CREATE POLICY "service write questions" ON questions FOR ALL USING (auth.role() = 'service_role');

-- sessions: public read (for big screen), service role write
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read sessions"   ON sessions FOR SELECT USING (true);
CREATE POLICY "service write sessions" ON sessions FOR ALL USING (auth.role() = 'service_role');

-- session_teams: same
ALTER TABLE session_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read teams"   ON session_teams FOR SELECT USING (true);
CREATE POLICY "service write teams" ON session_teams FOR ALL USING (auth.role() = 'service_role');

-- session_stages: same
ALTER TABLE session_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read stages"   ON session_stages FOR SELECT USING (true);
CREATE POLICY "service write stages" ON session_stages FOR ALL USING (auth.role() = 'service_role');
