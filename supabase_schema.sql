-- Exercise Groups table
CREATE TABLE IF NOT EXISTS exercise_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  color_class TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES exercise_groups(id),
  name TEXT NOT NULL,
  muscles TEXT[] DEFAULT '{}',
  reps INTEGER,
  duration INTEGER,
  difficulty TEXT DEFAULT 'intermediate',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE exercise_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;

-- Insert default groups if not exist
INSERT INTO exercise_groups (id, name, label, color_class, sort_order) VALUES
  ('upper-push', 'Upper Push', 'Upper Push', 'bg-blue-500/20 text-blue-400 border-blue-500/30', 1),
  ('upper-pull', 'Upper Pull', 'Upper Pull', 'bg-green-500/20 text-green-400 border-green-500/30', 2),
  ('lower-body', 'Lower Body', 'Lower Body', 'bg-purple-500/20 text-purple-400 border-purple-500/30', 3),
  ('core', 'Core', 'Core', 'bg-orange-500/20 text-orange-400 border-orange-500/30', 4),
  ('plyometric', 'Plyometric', 'Plyometric', 'bg-red-500/20 text-red-400 border-red-500/30', 5),
  ('cardio', 'Cardio/HIIT', 'Cardio/HIIT', 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 6)
ON CONFLICT (id) DO NOTHING;
