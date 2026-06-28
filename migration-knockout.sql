-- Run in Supabase SQL editor
-- Adds qualifier (who advances) to predictions for knockout rounds
-- Adds home_advances to matches for knockout draws (overtime/penalties)
-- Adds per-round scoring config (overrides clan settings for knockout rounds)

ALTER TABLE predictions ADD COLUMN IF NOT EXISTS qualifier TEXT CHECK (qualifier IN ('home', 'away'));

ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_advances BOOLEAN;

CREATE TABLE IF NOT EXISTS round_configs (
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL,
  points_exact  INT  NOT NULL DEFAULT 4,
  points_sign   INT  NOT NULL DEFAULT 1,
  points_advance INT NOT NULL DEFAULT 2,
  PRIMARY KEY (tournament_id, stage)
);
