import { useState, useEffect } from 'react';
import { Dumbbell, Clock, Play, Trash2, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/auth';
import { Workout } from '../data/types';
import { supabase } from '../supabase';

interface SavedWorkoutsProps {
  onLoadWorkout: (workout: Workout) => void;
}

export function SavedWorkouts({ onLoadWorkout }: SavedWorkoutsProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

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
        const loadedWorkouts: Workout[] = data.map(w => ({
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

  const getTotalExercises = (workout: Workout) => {
    return workout.stations.reduce((sum, station) => sum + station.exercises.length, 0);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDelete = async (workoutId: string) => {
    if (!confirm('Eliminare questo workout?')) return;
    
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
        <div className="space-y-3">
          {workouts.map(workout => (
            <div
              key={workout.id}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">{workout.name}</h3>
                  <div className="flex items-center gap-4 text-zinc-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      {getTotalExercises(workout)} exercises
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {workout.stations.length} stations
                    </span>
                    <span>{formatDate(workout.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {workout.stations.filter(s => s.exercises.length > 0).map(station => (
                      <span key={station.id} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                        {station.name.replace('Station ', '')} ({station.exercises.length})
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadWorkout(workout)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Avvia
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
