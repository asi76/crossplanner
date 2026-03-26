-- Import all existing exercises from static data into Supabase
-- Run this AFTER the schema SQL

-- Clear existing exercises (if any)
DELETE FROM exercises;

-- Insert all exercises
INSERT INTO exercises (id, group_id, name, muscles, reps, duration, difficulty) VALUES
-- Upper Push
('up1', 'upper-push', 'Push-Ups', '{"Chest", "Shoulders", "Triceps"}', 15, NULL, 'beginner'),
('up2', 'upper-push', 'Diamond Push-Ups', '{"Chest", "Triceps"}', 12, NULL, 'intermediate'),
('up3', 'upper-push', 'Pike Push-Ups', '{"Shoulders", "Triceps"}', 10, NULL, 'intermediate'),
('up4', 'upper-push', 'Dumbbell Bench Press', '{"Chest", "Shoulders", "Triceps"}', 12, NULL, 'intermediate'),
('up5', 'upper-push', 'Overhead Press', '{"Shoulders", "Triceps"}', 10, NULL, 'intermediate'),
('up6', 'upper-push', 'Dips', '{"Chest", "Triceps", "Shoulders"}', 12, NULL, 'intermediate'),
('up7', 'upper-push', 'Decline Push-Ups', '{"Upper Chest", "Shoulders", "Triceps"}', 12, NULL, 'intermediate'),
('up8', 'upper-push', 'Close-Grip Bench Press', '{"Triceps", "Chest"}', 10, NULL, 'advanced'),
('up9', 'upper-push', 'Arnold Press', '{"Shoulders", "Triceps"}', 10, NULL, 'intermediate'),
('up10', 'upper-push', 'Cable Chest Fly', '{"Chest"}', 12, NULL, 'intermediate'),
('up11', 'upper-push', 'Wall Handstand Push-Ups', '{"Shoulders", "Triceps"}', 8, NULL, 'advanced'),

-- Upper Pull
('upl1', 'upper-pull', 'Pull-Ups', '{"Lats", "Biceps", "Rear Delts"}', 8, NULL, 'intermediate'),
('upl2', 'upper-pull', 'Chin-Ups', '{"Biceps", "Lats"}', 10, NULL, 'intermediate'),
('upl3', 'upper-pull', 'Bent Over Rows', '{"Back", "Biceps"}', 12, NULL, 'intermediate'),
('upl4', 'upper-pull', 'Lat Pulldown', '{"Lats", "Biceps"}', 12, NULL, 'beginner'),
('upl5', 'upper-pull', 'Face Pulls', '{"Rear Delts", "Upper Back"}', 15, NULL, 'beginner'),
('upl6', 'upper-pull', 'Dumbbell Curls', '{"Biceps"}', 12, NULL, 'beginner'),
('upl7', 'upper-pull', 'Hammer Curls', '{"Biceps", "Forearms"}', 12, NULL, 'beginner'),
('upl8', 'upper-pull', 'Deadlifts', '{"Back", "Biceps", "Glutes"}', 10, NULL, 'intermediate'),
('upl9', 'upper-pull', 'Seated Cable Row', '{"Back", "Biceps"}', 12, NULL, 'beginner'),
('upl10', 'upper-pull', 'Inverted Rows', '{"Back", "Biceps"}', 12, NULL, 'intermediate'),
('upl11', 'upper-pull', 'Preacher Curls', '{"Biceps"}', 10, NULL, 'intermediate'),

-- Lower Body
('lb1', 'lower-body', 'Squats', '{"Quads", "Glutes", "Hamstrings"}', 15, NULL, 'beginner'),
('lb2', 'lower-body', 'Lunges', '{"Quads", "Glutes", "Hamstrings"}', 12, NULL, 'beginner'),
('lb3', 'lower-body', 'Romanian Deadlifts', '{"Hamstrings", "Glutes", "Lower Back"}', 12, NULL, 'intermediate'),
('lb4', 'lower-body', 'Leg Press', '{"Quads", "Glutes"}', 12, NULL, 'beginner'),
('lb5', 'lower-body', 'Bulgarian Split Squats', '{"Quads", "Glutes"}', 10, NULL, 'intermediate'),
('lb6', 'lower-body', 'Hip Thrusts', '{"Glutes", "Hamstrings"}', 15, NULL, 'intermediate'),
('lb7', 'lower-body', 'Calf Raises', '{"Calves"}', 20, NULL, 'beginner'),
('lb8', 'lower-body', 'Goblet Squats', '{"Quads", "Glutes"}', 12, NULL, 'beginner'),
('lb9', 'lower-body', 'Step-Ups', '{"Quads", "Glutes"}', 12, NULL, 'beginner'),
('lb10', 'lower-body', 'Wall Sit', '{"Quads", "Glutes"}', NULL, 45, 'beginner'),
('lb11', 'lower-body', 'Glute Bridges', '{"Glutes", "Hamstrings"}', 15, NULL, 'beginner'),

-- Core
('core1', 'core', 'Plank', '{"Abs", "Obliques", "Lower Back"}', NULL, 45, 'beginner'),
('core2', 'core', 'Crunches', '{"Abs"}', 20, NULL, 'beginner'),
('core3', 'core', 'Bicycle Crunches', '{"Abs", "Obliques"}', 20, NULL, 'beginner'),
('core4', 'core', 'Leg Raises', '{"Lower Abs"}', 15, NULL, 'intermediate'),
('core5', 'core', 'Russian Twists', '{"Obliques", "Abs"}', 20, NULL, 'beginner'),
('core6', 'core', 'Mountain Climbers', '{"Abs", "Hip Flexors"}', NULL, 30, 'intermediate'),
('core7', 'core', 'Dead Bug', '{"Abs", "Lower Back"}', 12, NULL, 'beginner'),
('core8', 'core', 'Side Plank', '{"Obliques", "Abs"}', NULL, 30, 'intermediate'),
('core9', 'core', 'Ab Rollout', '{"Abs"}', 12, NULL, 'intermediate'),
('core10', 'core', 'V-Ups', '{"Abs", "Hip Flexors"}', 15, NULL, 'intermediate'),
('core11', 'core', 'Flutter Kicks', '{"Lower Abs"}', 20, NULL, 'intermediate'),

-- Plyometric
('ply1', 'plyometric', 'Jump Squats', '{"Quads", "Glutes", "Calves"}', 12, NULL, 'intermediate'),
('ply2', 'plyometric', 'Burpees', '{"Full Body"}', 10, NULL, 'advanced'),
('ply3', 'plyometric', 'Box Jumps', '{"Quads", "Glutes", "Calves"}', 10, NULL, 'intermediate'),
('ply4', 'plyometric', 'Lateral Jumps', '{"Glutes", "Quads", "Calves"}', 12, NULL, 'intermediate'),
('ply5', 'plyometric', 'Jump Lunges', '{"Quads", "Glutes"}', 10, NULL, 'intermediate'),
('ply6', 'plyometric', 'Tuck Jumps', '{"Full Body"}', 8, NULL, 'advanced'),
('ply7', 'plyometric', 'Squat Thrusts', '{"Full Body"}', 12, NULL, 'intermediate'),
('ply8', 'plyometric', 'Skater Jumps', '{"Glutes", "Quads", "Balance"}', 12, NULL, 'intermediate'),
('ply9', 'plyometric', 'Clap Push-Ups', '{"Chest", "Shoulders", "Triceps"}', 8, NULL, 'advanced'),
('ply10', 'plyometric', 'Plyo Push-Ups', '{"Chest", "Shoulders", "Triceps"}', 10, NULL, 'intermediate'),
('ply11', 'plyometric', 'Explosive Mountain Climbers', '{"Abs", "Hip Flexors", "Cardio"}', NULL, 30, 'advanced'),

-- Cardio
('card1', 'cardio', 'Jumping Jacks', '{"Full Body"}', NULL, 45, 'beginner'),
('card2', 'cardio', 'High Knees', '{"Hip Flexors", "Quads", "Cardio"}', NULL, 30, 'beginner'),
('card3', 'cardio', 'Butt Kicks', '{"Hamstrings", "Cardio"}', NULL, 30, 'beginner'),
('card4', 'cardio', 'Sprint in Place', '{"Full Body", "Cardio"}', NULL, 20, 'intermediate'),
('card5', 'cardio', 'Burpees (Cardio)', '{"Full Body"}', 10, NULL, 'intermediate'),
('card6', 'cardio', 'Mountain Climbers (Fast)', '{"Abs", "Cardio"}', NULL, 30, 'intermediate'),
('card7', 'cardio', 'Jump Rope', '{"Calves", "Cardio"}', NULL, 45, 'intermediate'),
('card8', 'cardio', 'Squat Jumps (Cardio)', '{"Quads", "Glutes", "Cardio"}', 15, NULL, 'intermediate'),
('card9', 'cardio', 'Shadow Boxing', '{"Arms", "Core", "Cardio"}', NULL, 45, 'intermediate'),
('card10', 'cardio', 'Fast Feet', '{"Legs", "Cardio"}', NULL, 30, 'beginner'),
('card11', 'cardio', 'Plank Jacks', '{"Abs", "Cardio"}', NULL, 30, 'intermediate');
