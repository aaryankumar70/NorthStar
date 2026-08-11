/*
# Northstar Content Tables — Pulse, Skills, Library, Compass Picks

## Overview
Creates the intelligence content tables populated by scheduled edge functions
and manual seeding. All content is keyed by profession (except compass_picks
which is global). The frontend reads only from these tables.

## New Tables

1. `pulse_items` — daily news cards per profession (from GNews API, cached)
   - id (uuid PK)
   - profession_id (uuid FK → professions)
   - headline (text)
   - summary (text)
   - source (text)
   - source_url (text)
   - published_date (date)
   - why_it_matters (text) — filled by Gemini synthesis
   - fetched_date (date) — the day this was fetched
   - created_at (timestamptz)

2. `ascending_skills` — rising skills per profession (Gemini synthesis)
   - id (uuid PK)
   - profession_id (uuid FK)
   - name (text)
   - description (text)
   - why_rising (text)
   - fetched_date (date)

3. `fading_skills` — declining skills per profession (Gemini synthesis)
   - id (uuid PK)
   - profession_id (uuid FK)
   - name (text)
   - why_fading (text)
   - still_useful_for (text)
   - modern_alternative (text)
   - fetched_date (date)

4. `library_items` — books, papers, tools per profession
   - id (uuid PK)
   - profession_id (uuid FK)
   - type (text: book/paper/tool)
   - title (text)
   - author_or_source (text)
   - why_it_matters (text)
   - url (text, nullable)
   - fetched_date (date)

5. `compass_picks` — hand-curated weekly item, global (not per profession)
   - id (uuid PK)
   - title (text)
   - body (text)
   - link (text, nullable)
   - week_label (text)
   - created_at (timestamptz)

## Security
- All content tables: read-only for authenticated users (shared intelligence data).
  Writes happen via edge functions using the service role key, not from the frontend.
- RLS enabled on all tables.
*/

-- ============ PULSE_ITEMS ============
CREATE TABLE IF NOT EXISTS pulse_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  headline text NOT NULL,
  summary text NOT NULL,
  source text NOT NULL,
  source_url text,
  published_date date,
  why_it_matters text,
  fetched_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE pulse_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_pulse_items" ON pulse_items;
CREATE POLICY "read_pulse_items" ON pulse_items FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_pulse_profession_date ON pulse_items(profession_id, fetched_date DESC);

-- ============ ASCENDING_SKILLS ============
CREATE TABLE IF NOT EXISTS ascending_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  why_rising text NOT NULL,
  fetched_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ascending_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_ascending_skills" ON ascending_skills;
CREATE POLICY "read_ascending_skills" ON ascending_skills FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_ascending_profession_date ON ascending_skills(profession_id, fetched_date DESC);

-- ============ FADING_SKILLS ============
CREATE TABLE IF NOT EXISTS fading_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  name text NOT NULL,
  why_fading text NOT NULL,
  still_useful_for text NOT NULL,
  modern_alternative text NOT NULL,
  fetched_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fading_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_fading_skills" ON fading_skills;
CREATE POLICY "read_fading_skills" ON fading_skills FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_fading_profession_date ON fading_skills(profession_id, fetched_date DESC);

-- ============ LIBRARY_ITEMS ============
CREATE TABLE IF NOT EXISTS library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id uuid NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('book', 'paper', 'tool')),
  title text NOT NULL,
  author_or_source text NOT NULL,
  why_it_matters text NOT NULL,
  url text,
  fetched_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_library_items" ON library_items;
CREATE POLICY "read_library_items" ON library_items FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_library_profession_type ON library_items(profession_id, type, fetched_date DESC);

-- ============ COMPASS_PICKS ============
CREATE TABLE IF NOT EXISTS compass_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  week_label text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE compass_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_compass_picks" ON compass_picks;
CREATE POLICY "read_compass_picks" ON compass_picks FOR SELECT
  TO authenticated USING (true);
