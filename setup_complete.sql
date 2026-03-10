-- =============================================================================
-- HOW TO BE HUMAN — Complete Database Setup
-- Run this entire file in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).
-- It is safe to run multiple times — all statements use IF NOT EXISTS / ON CONFLICT.
-- =============================================================================


-- ─── 1. SUBJECTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  category    text NOT NULL,
  description text,
  is_published boolean DEFAULT false,
  coming_soon  boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Public read access on subjects'
  ) THEN
    CREATE POLICY "Public read access on subjects" ON subjects FOR SELECT USING (true);
  END IF;
END $$;


-- ─── 2. CONNECTIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_a  text REFERENCES subjects(id),
  subject_b  text REFERENCES subjects(id),
  description text
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'connections' AND policyname = 'Public read access on connections'
  ) THEN
    CREATE POLICY "Public read access on connections" ON connections FOR SELECT USING (true);
  END IF;
END $$;


-- ─── 3. LESSONS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id      text REFERENCES subjects(id),
  title           text NOT NULL,
  level           text CHECK (level IN ('beginner','intermediate','advanced')),
  order_index     integer DEFAULT 0,
  content         text,
  is_published    boolean DEFAULT false,
  is_preview      boolean DEFAULT false,
  -- Pipeline columns (added in Phase 4)
  sources         text[]    DEFAULT '{}',
  last_verified_at timestamptz,
  generated_at    timestamptz,
  generation_model text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Add pipeline columns if they don't exist yet (safe to run on existing table)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS sources         text[]    DEFAULT '{}';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS generated_at    timestamptz;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS generation_model text;

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Public read access on published lessons'
  ) THEN
    CREATE POLICY "Public read access on published lessons"
      ON lessons FOR SELECT
      USING (is_published = true OR is_preview = true);
  END IF;
END $$;


-- ─── 4. USERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id),
  email           text NOT NULL,
  has_access      boolean DEFAULT false,
  payment_date    timestamptz,
  notify_subjects text[] DEFAULT '{}'::text[],
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own data'
  ) THEN
    CREATE POLICY "Users can view own data"   ON users FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;


-- ─── 5. PROGRESS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id),
  lesson_id    uuid REFERENCES lessons(id),
  completed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'progress' AND policyname = 'Users can read own progress'
  ) THEN
    CREATE POLICY "Users can read own progress"   ON progress FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own progress" ON progress FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ─── 6. SOURCE CACHE (pipeline) ───────────────────────────────────────────────
-- Caches research results from Wikipedia, Perplexity, OpenStax, etc.
-- TTL is enforced in application code (30 days).
-- IMPORTANT: level uses "all" for non-level-specific sources (avoids NULL in unique constraint).
CREATE TABLE IF NOT EXISTS source_cache (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id   text NOT NULL,
  source_name  text NOT NULL,  -- wikipedia | perplexity | openstax | khan | gutenberg | pubmed | mit
  level        text NOT NULL DEFAULT 'all',  -- actual level for perplexity, "all" for others
  content      text,
  source_urls  text[] DEFAULT '{}',
  fetched_at   timestamptz DEFAULT now(),
  UNIQUE (subject_id, source_name, level)
);

-- Fast lookup index
CREATE INDEX IF NOT EXISTS idx_source_cache_lookup
  ON source_cache (subject_id, source_name, level);


-- ─── 7. NOTIFY EMAILS (coming soon subscriptions) ─────────────────────────────
-- Stores email addresses of guests who want to be notified when a subject launches.
-- Logged-in users use the notify_subjects array on the users table instead.
CREATE TABLE IF NOT EXISTS notify_emails (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  subject_id text REFERENCES subjects(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (email, subject_id)
);


-- ─── 8. AUTO-CREATE USER ROW ON SIGNUP ────────────────────────────────────────
-- Trigger: when a user signs up via Supabase Auth, insert a row into public.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, has_access, notify_subjects)
  VALUES (NEW.id, NEW.email, false, '{}')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =============================================================================
-- Done. All tables created / updated.
-- Next: run seed.sql to populate subjects and connections if not already done.
-- =============================================================================
