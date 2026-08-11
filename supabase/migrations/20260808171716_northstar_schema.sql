/*
# Northstar Schema — Fields, Professions, User Profiles

## Overview
Creates the foundational reference and user tables for Northstar, a personal
industry intelligence dashboard. Reference data (fields, professions) is
shared across all users. User profiles store each user's primary profession.

## New Tables

1. `fields` — top-level industry fields (IT/CS, Finance, Law)
   - id (uuid PK)
   - name (text, unique)
   - slug (text, unique)
   - display_order (int)
   - created_at (timestamptz)

2. `professions` — professions within a field
   - id (uuid PK)
   - field_id (uuid FK → fields)
   - name (text)
   - slug (text)
   - keywords (text[]) — 2-3 keywords used for API queries
   - display_order (int)
   - created_at (timestamptz)

3. `user_profiles` — per-user primary profession
   - id (uuid PK, = auth.users.id)
   - primary_profession_id (uuid FK → professions)
   - onboarded (boolean default false)
   - created_at, updated_at (timestamptz)

## Security
- `fields`, `professions`: public read for authenticated users (shared reference data). No writes from frontend.
- `user_profiles`: each authenticated user reads/writes only their own profile row.
- RLS enabled on all tables.
*/

-- ============ FIELDS ============
CREATE TABLE IF NOT EXISTS fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_fields" ON fields;
CREATE POLICY "read_fields" ON fields FOR SELECT
  TO authenticated USING (true);

-- ============ PROFESSIONS ============
CREATE TABLE IF NOT EXISTS professions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(field_id, slug)
);
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_professions" ON professions;
CREATE POLICY "read_professions" ON professions FOR SELECT
  TO authenticated USING (true);

-- ============ USER_PROFILES ============
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_profession_id uuid REFERENCES professions(id) ON DELETE SET NULL,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
