-- =============================================================================
-- HOW TO BE HUMAN — Grade System Migration
-- Run in Supabase SQL Editor after setup_complete.sql.
-- Switches the curriculum from beginner/intermediate/advanced to Grade 1–12.
-- =============================================================================

-- Drop the old level constraint so we can use grade_1 through grade_12
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_level_check;

-- Add a new constraint that accepts both the old values (safe) and grades
-- Using text without constraint is fine — the app enforces valid values.
-- If you want a constraint, uncomment the block below:

-- ALTER TABLE lessons ADD CONSTRAINT lessons_level_check
--   CHECK (level IN (
--     'grade_1','grade_2','grade_3','grade_4','grade_5','grade_6',
--     'grade_7','grade_8','grade_9','grade_10','grade_11','grade_12',
--     'beginner','intermediate','advanced'  -- kept for backward compat
--   ));

-- Add a grade_num column for easy numeric sorting (optional but useful)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS grade_num integer;

-- Back-fill grade_num from existing level values
UPDATE lessons SET grade_num = 1  WHERE level = 'beginner';
UPDATE lessons SET grade_num = 6  WHERE level = 'intermediate';
UPDATE lessons SET grade_num = 12 WHERE level = 'advanced';
UPDATE lessons SET grade_num = CAST(SUBSTRING(level FROM 'grade_(\d+)') AS integer)
  WHERE level LIKE 'grade_%';

-- Index for sorting by grade
CREATE INDEX IF NOT EXISTS idx_lessons_grade ON lessons (subject_id, grade_num, order_index);

-- source_cache: make sure it can handle grade_1..grade_12 as level keys (already text, no change needed)
-- notify_emails: no change needed

SELECT 'Grade migration complete.' AS status;
