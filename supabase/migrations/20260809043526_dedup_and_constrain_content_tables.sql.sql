-- Step 1: Remove duplicate pulse_items, keeping one per (profession_id, headline, fetched_date)
DELETE FROM pulse_items
WHERE id NOT IN (
  SELECT min(id::text)::uuid FROM pulse_items
  GROUP BY profession_id, headline, fetched_date
);

-- Step 2: Remove duplicate library_items, keeping one per (profession_id, title, type, fetched_date)
DELETE FROM library_items
WHERE id NOT IN (
  SELECT min(id::text)::uuid FROM library_items
  GROUP BY profession_id, title, type, fetched_date
);

-- Step 3: Add unique constraint on pulse_items
ALTER TABLE pulse_items
  ADD CONSTRAINT pulse_items_profession_headline_date_unique
  UNIQUE (profession_id, headline, fetched_date);

-- Step 4: Add unique constraint on library_items
ALTER TABLE library_items
  ADD CONSTRAINT library_items_profession_title_type_unique
  UNIQUE (profession_id, title, type, fetched_date);