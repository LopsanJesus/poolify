-- Run in Supabase SQL editor
-- Adds qualifier (who advances) to predictions for knockout rounds
-- Adds home_advances to matches for knockout draws (overtime/penalties)

ALTER TABLE predictions ADD COLUMN IF NOT EXISTS qualifier TEXT CHECK (qualifier IN ('home', 'away'));

ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_advances BOOLEAN;
