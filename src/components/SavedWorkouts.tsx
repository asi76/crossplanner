import { useState, useEffect } from 'react';
import { Dumbbell, Play, Trash2, LogOut, ChevronDown, ChevronUp, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/auth';
import { Workout } from '../data/types';
import { supabase } from '../supabase';
import { getGifUrl } from '../data/gifMapping';

interface SavedWorkoutsProps {
  onLoadWorkout: (workout: Workout) => void;
}

const WORKOUT_CATEGORIES = [
  { id: 'forza', name: 'Forza' },
  { id: 'cardio1', name: 'Cardio 1' },
  { id: 'cardio2', name: 'Cardio 2' }
];

export function SavedWorkouts({ onLoadWorkout }: SavedWorkoutsProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [viewingExercise, setViewingExercise] = useState<any>(null);
  const [viewingExerciseGif, setViewingExerciseGif] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading workouts:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        const loadedWorkouts: Workout[] = data.map((w: any) => ({
          id: w.id,
          name: w.name,
          stations: w.stations || [],
          createdAt: new Date(w.created_at)
        }));
        setWorkouts(loadedWorkouts);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    
    setLoading(false);
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDelete = async (workoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Sei sicuro di voler eliminare questo workout?')) return;
    if (!confirm('Conferma eliminazione definitiva?')) return;
    
    try {
      await supabase.from('workouts').delete().eq('id', workoutId);
      setWorkouts(workouts.filter(w => w.id !== workoutId));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleViewExercise = async (exercise: any) => {
    setViewingExercise(exercise);
    const gifUrl = await getGifUrl(exercise.exerciseId);
    setViewingExerciseGif(gifUrl);
  };

  const getExercisesByCategory = (workout: Workout, categoryId: string) => {
    const category = workout.stations.find((s: any) => s.id === categoryId);
    return category?.exercises || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-zinc-400">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Miei Workout</h2>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nessun workout salvato</p>
          <p className="text-sm mt-2">Crea il tuo primo workout!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map(workout => (
            <div key={workout.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              {/* Workout Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {expandedWorkout === workout.id ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  )}
                  <div>
                    <h3 className="text-white font-semibold">{workout.name}</h3>
                    <span className="text-zinc-500 text-sm">{formatDate(workout.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadWorkout(workout);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Avvia
                  </button>
                  <button
                    onClick={(e) => handleDelete(workout.id, e)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Elimina workout"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Expanded Content - Category Tabs and Exercises */}
              {expandedWorkout === workout.id && (
                <div className="border-t border-zinc-800">
                  {/* Header with trash */}
                  <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/30 border-b border-zinc-800">
                    <span className="text-zinc-400 text-sm">Esercizi salvati</span>
                    <button
                      onClick={(e) => handleDelete(workout.id, e)}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
                      title="Elimina workout"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex gap-2 p-4 border-b border-zinc-800">
                    {WORKOUT_CATEGORIES.map((cat) => {
                      const exercises = getExercisesByCategory(workout, cat.id);
                      return (
                        <div key={cat.id} className="flex-1">
                          <div className="text-center mb-2">
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              exercises.length > 0 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {cat.name} ({exercises.length})
                            </span>
                          </div>
                          {/* Exercise List */}
                          <div className="space-y-2">
                            {exercises.map((ex: any, idx: number) => (
                              <div key={idx} className="bg-zinc-800/50 rounded-lg p-2">
                                <button
                                  onClick={() => handleViewExercise(ex)}
                                  className="w-full text-left"
                                >
                                  <span className="text-white text-sm font-medium hover:text-blue-400 transition-colors">
                                    {ex.exerciseName || ex.exerciseId}
                                  </span>
                                  <div className="text-zinc-500 text-xs mt-0.5">
                                    {ex.sets} x {ex.reps}
                                  </div>
                                </button>
                              </div>
                            ))}
                            {exercises.length === 0 && (
                              <div className="text-zinc-600 text-xs text-center py-2">
                                Nessun esercizio
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View-Only Exercise Modal */}
      {viewingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setViewingExercise(null)}>
          <div 
            className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-white">{viewingExercise.exerciseName || viewingExercise.exerciseId}</h2>
              </div>
              <button
                onClick={() => setViewingExercise(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row max-h-[calc(80vh-70px)]">
              {/* Left - GIF */}
              <div className="md:w-1/2 bg-zinc-950 flex items-center justify-center p-4 min-h-[200px]">
                {viewingExerciseGif ? (
                  <img 
                    src={viewingExerciseGif} 
                    alt={viewingExercise.exerciseName} 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-zinc-500 text-center">
                    <Dumbbell className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessuna immagine</p>
                  </div>
                )}
              </div>

              {/* Right - Sets/Reps Info */}
              <div className="md:w-1/2 p-6 overflow-y-auto modal-scroll">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-zinc-500 mb-1.5">Serie e Ripetizioni</h3>
                    <p className="text-white text-sm">
                      {viewingExercise.sets} x {viewingExercise.reps}
                      {viewingExercise.rest && ` - ${viewingExercise.rest}s pausa`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
