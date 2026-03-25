import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { exercises, muscleGroupLabels, muscleGroupColors, getExercisesByMuscleGroup } from '../data/exercises';
import { MuscleGroup, Exercise } from '../data/types';
import { gifMapping } from '../data/gifMapping';
import { ExerciseDetailModal } from './ExerciseDetailModal';

const muscleGroups: MuscleGroup[] = ['upper-push', 'upper-pull', 'lower-body', 'core', 'plyometric', 'cardio'];

export function ExerciseLibrary() {
  const [expandedGroup, setExpandedGroup] = useState<MuscleGroup | null>('upper-push');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [localGifMapping, setLocalGifMapping] = useState<Record<string, string>>({});

  // Get all exercises in order for navigation
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

  // Update GIF mapping when a GIF is uploaded/deleted
  const handleGifUpdated = (exerciseId: string, newUrl: string | null) => {
    setLocalGifMapping(prev => {
      const updated = { ...prev };
      if (newUrl) {
        updated[exerciseId] = newUrl;
      } else {
        delete updated[exerciseId];
      }
      return updated;
    });
  };

  const getGifUrl = (exerciseId: string): string | null => {
    // Check local mapping first (for newly uploaded GIFs)
    if (localGifMapping[exerciseId]) {
      return localGifMapping[exerciseId];
    }
    // Fall back to static mapping
    if (gifMapping[exerciseId]) {
      return gifMapping[exerciseId];
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Exercise Library</h2>
      <p className="text-sm text-zinc-400">Clicca sul nome di un esercizio per vedere i dettagli</p>

      <div className="space-y-3">
        {muscleGroups.map(group => (
          <div key={group} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${muscleGroupColors[group]}`}>
                  {muscleGroupLabels[group]}
                </span>
                <span className="text-sm text-zinc-400">
                  {getExercisesByMuscleGroup(group).length} esercizi
                </span>
              </div>
              {expandedGroup === group ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {expandedGroup === group && (
              <div className="border-t border-zinc-800">
                {getExercisesByMuscleGroup(group).map(exercise => (
                  <div
                    key={exercise.id}
                    className="px-4 py-3 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => handleExerciseClick(exercise)}
                          className="text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
                        >
                          {exercise.name}
                        </button>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {exercise.muscles.map(muscle => (
                            <span key={muscle} className="text-xs text-zinc-500">{muscle}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exercise.reps && (
                          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                            {exercise.reps} reps
                          </span>
                        )}
                        {exercise.duration && (
                          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                            {exercise.duration}s
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
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
