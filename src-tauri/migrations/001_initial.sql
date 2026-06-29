PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  abbr TEXT NOT NULL,
  location TEXT,
  league TEXT,
  stadium TEXT,
  primary_color TEXT DEFAULT '#ff7a18',
  secondary_color TEXT DEFAULT '#050505',
  logo_path TEXT,
  coaches_json TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  game_date TEXT NOT NULL,
  location TEXT,
  home_team_id TEXT NOT NULL REFERENCES teams(id),
  away_team_id TEXT NOT NULL REFERENCES teams(id),
  quarter_length_seconds INTEGER NOT NULL DEFAULT 720,
  status TEXT NOT NULL DEFAULT 'pregame',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plays (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  quarter TEXT NOT NULL,
  clock_start_seconds INTEGER NOT NULL,
  clock_end_seconds INTEGER,
  offense_team_id TEXT NOT NULL REFERENCES teams(id),
  defense_team_id TEXT NOT NULL REFERENCES teams(id),
  down INTEGER,
  distance INTEGER,
  absolute_yardline INTEGER,
  play_type TEXT NOT NULL,
  yards INTEGER DEFAULT 0,
  yac INTEGER DEFAULT 0,
  return_yards INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  turnover INTEGER DEFAULT 0,
  touchdown INTEGER DEFAULT 0,
  first_down INTEGER DEFAULT 0,
  result TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drives (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id),
  start_play_seq INTEGER NOT NULL,
  end_play_seq INTEGER,
  offensive_plays INTEGER NOT NULL DEFAULT 0,
  yards INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'In Progress'
);

INSERT OR REPLACE INTO app_meta(key, value) VALUES ('schema_version', '2.0.1');
