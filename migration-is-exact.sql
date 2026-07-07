-- Run in Supabase SQL editor
-- Fixes the ranking "exactos" column, which was inferring an exact-score
-- hit by comparing a prediction's total points against a threshold derived
-- from the clan's default settings. That threshold ignored per-round
-- knockout scoring overrides (round_configs), so predictions that only got
-- sign + advance points could be miscounted as exact once the round's own
-- points_sign/points_advance summed to the same (or a higher) value.
--
-- This stores whether the exact score was hit directly on each prediction,
-- computed at the same time (and from the same inputs) as `points`, so the
-- ranking no longer has to reverse-engineer it from a point total.

ALTER TABLE predictions ADD COLUMN IF NOT EXISTS is_exact BOOLEAN NOT NULL DEFAULT false;

-- After running the ALTER above, backfill existing finished-match
-- predictions by re-running the admin "recalculate all finished matches"
-- action (recalcAllFinishedMatchPoints in src/app/actions/admin.ts), which
-- now also populates is_exact for every prediction it recalculates.
