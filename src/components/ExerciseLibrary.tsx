import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { exercises, muscleGroupLabels, muscleGroupColors, getExercisesByMuscleGroup } from '../data/exercises';
import { MuscleGroup, Exercise } from '../data/types';
import { supabase } from '../supabase';
import { ExerciseDetailModal } from './ExerciseDetailModal';

const SUPABASE_URL = 'https://kdsstxsthxusgcizzmpr.supabase.co';

const muscleGroups: MuscleGroup[] = ['upper-push', 'upper-pull', 'lower-body', 'core', 'plyometric', 'cardio'];

// Load GIF URLs from database
async function loadGifMappings(): Promise<Record<string, string>> {
  const mapping: Record<string, string> = {};
  
  try {
    const { data, error } = await supabase
      .from('gif_mappings')
      .select('exercise_id, gif_url');
    
    if (error) {
      console.error('Error loading GIF mappings:', error);
      return mapping;
    }
    
    if (data && data.length > 0) {
      data.forEach(row => {
        mapping[row.exercise_id] = row.gif_url;
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
  
  return mapping;
}

export function ExerciseLibrary() {
  const [expandedGroup, setExpandedGroup] = useState<MuscleGroup | null>('upper-push');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [gifMapping, setGifMapping] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Load GIF mappings from Supabase on mount
  useEffect(() => {
    loadGifMappings().then(mapping => {
      setGifMapping(mapping);
    });
  }, [refreshKey]);

  const allExercises = exercises;

  const getExerciseIndex = (exercise: Exercise) => {
    return allExercises.findIndex(e => e.id === exercise.id);
  };

  const handlePrevExercise = () => {
    if (!selectedExercise) return;
    const currentIndex = getExerciseIndex(selectedExercise);
    if (currentIndex > 0) {
      setSelectedExercise(allExercises[currentIndex - 1]);
    }
  };

  const handleNextExercise = () => {
    if (!selectedExercise) return;
    const currentIndex = getExerciseIndex(selectedExercise);
    if (currentIndex < allExercises.length - 1) {
      setSelectedExercise(allExercises[currentIndex + 1]);
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  // Reload GIF URLs after upload/delete
  const handleGifUpdated = useCallback(() => {
    setRefreshKey(k => k + 1);
    loadGifMappings().then(mapping => {
      setGifMapping(mapping);
    });
  }, []);

  const getGifUrl = (exerciseId: string): string | null => {
    return gifMapping[exerciseId] || null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Exercise Library</h2>
      <p className="text-base text-zinc-400">Clicca sul nome di un esercizio per vedere i dettagli</p>

      <div className="space-y-3">
        {muscleGroups.map(group => (
          <div key={group} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded text-sm font-semibold border ${muscleGroupColors[group]}`}>
                  {muscleGroupLabels[group]}
                </span>
                <span className="text-base text-zinc-400">
                  {getExercisesByMuscleGroup(group).length} esercizi
                </span>
              </div>
              {expandedGroup === group ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {expandedGroup === group && (
              <div className="border-t border-zinc-800">
                {getExercisesByMuscleGroup(group).map(exercise => (
                  <div
                    key={exercise.id}
                    className="px-5 py-4 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => handleExerciseClick(exercise)}
                          className="text-lg font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
                        >
                          {exercise.name}
                        </button>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {exercise.muscles.map(muscle => (
                            <span key={muscle} className="text-sm text-zinc-500">{muscle}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exercise.reps && (
                          <span className="text-sm bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded">
                            {exercise.reps} reps
                          </span>
                        )}
                        {exercise.duration && (
                          <span className="text-sm bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded">
                            {exercise.duration}s
                          </span>
                        )}
                        <span className={`text-sm px-2 py-1 rounded ${
                          exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          gifUrl={getGifUrl(selectedExercise.id)}
          onClose={() => setSelectedExercise(null)}
          onPrev={handlePrevExercise}
          onNext={handleNextExercise}
          hasPrev={getExerciseIndex(selectedExercise) > 0}
          hasNext={getExerciseIndex(selectedExercise) < allExercises.length - 1}
          onGifUpdated={handleGifUpdated}
        />
      )}
    </div>
  );
}
