import { useState } from 'react';
import { Plus, X, Dumbbell, Trash2 } from 'lucide-react';
import { exercises, muscleGroupLabels, muscleGroupColors, getExercisesByMuscleGroup } from '../data/exercises';
import { MuscleGroup, Workout, Station, WorkoutExercise } from '../data/types';
import { supabase } from '../supabase';

const muscleGroups: MuscleGroup[] = ['upper-push', 'upper-pull', 'lower-body', 'core', 'plyometric', 'cardio'];

interface CreateWorkoutProps {
  onSave: (workout: Workout) => void;
}

export function CreateWorkout({ onSave }: CreateWorkoutProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [stations, setStations] = useState<Station[]>([
    { id: '1', name: 'Station 1', exercises: [] }
  ]);
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  // All groups expanded by default
  const [expandedGroups] = useState<Set<MuscleGroup>>(new Set(muscleGroups));

  const currentStation = stations[selectedStationIndex];

  const handleAddStation = () => {
    const newStation: Station = {
      id: Date.now().toString(),
      name: `Station ${stations.length + 1}`,
      exercises: []
    };
    setStations([...stations, newStation]);
    setSelectedStationIndex(stations.length);
  };

  const handleRemoveStation = (index: number) => {
    if (stations.length === 1) return;
    const newStations = stations.filter((_, i) => i !== index);
    setStations(newStations);
    if (selectedStationIndex >= newStations.length) {
      setSelectedStationIndex(newStations.length - 1);
    }
  };

  const handleAddExercise = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      sets: exercise.reps ? 3 : 4,
      reps: exercise.reps || 10,
      rest: 60
    };

    const newStations = [...stations];
    newStations[selectedStationIndex].exercises.push(newExercise);
    setStations(newStations);
  };

  const handleRemoveExercise = (stationIndex: number, exerciseIndex: number) => {
    const newStations = [...stations];
    newStations[stationIndex].exercises.splice(exerciseIndex, 1);
    setStations(newStations);
  };

  const handleSave = async () => {
    if (!workoutName.trim() || stations.every(s => s.exercises.length === 0)) {
      alert('Inserisci un nome e aggiungi almeno un esercizio');
      return;
    }

    const workout: Workout = {
      id: Date.now().toString(),
      name: workoutName,
      stations: stations.filter(s => s.exercises.length > 0),
      createdAt: new Date()
    };

    // Save to Supabase for cross-browser persistence
    try {
      const { error } = await supabase
        .from('workouts')
        .insert({
          id: workout.id,
          name: workout.name,
          stations: workout.stations,
          created_at: workout.createdAt.toISOString()
        });
      
      if (error) {
        console.error('Error saving workout:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }

    onSave(workout);
    setWorkoutName('');
    setStations([{ id: '1', name: 'Station 1', exercises: [] }]);
  };

  const getExerciseById = (id: string) => exercises.find(e => e.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Crea Workout</h2>
        <button
          onClick={handleAddStation}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Station
        </button>
      </div>

      {/* Workout Name */}
      <input
        type="text"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder="Nome del workout..."
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
      />

      {/* Stations Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stations.map((station, index) => (
          <div key={station.id} className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStationIndex(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedStationIndex === index
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {station.name}
            </button>
            {stations.length > 1 && (
              <button
                onClick={() => handleRemoveStation(index)}
                className="p-1 text-zinc-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Current Station Exercises */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <h3 className="text-white font-semibold mb-3">{currentStation.name}</h3>
        
        {currentStation.exercises.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nessun esercizio. Aggiungi dalla lista sotto.</p>
        ) : (
          <div className="space-y-2">
            {currentStation.exercises.map((ex, index) => {
              const exerciseData = getExerciseById(ex.exerciseId);
              return (
                <div key={index} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-medium">{exerciseData?.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 text-sm">
                      {ex.sets} × {ex.reps}
                    </span>
                    <button
                      onClick={() => handleRemoveExercise(selectedStationIndex, index)}
                      className="p-1 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
      >
        Salva Workout
      </button>

      {/* Exercise Library - All groups expanded */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Libreria Esercizi</h3>
        
        <div className="space-y-3">
          {muscleGroups.map(group => (
            <div key={group} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              {/* Group Header */}
              <div className="px-4 py-3 bg-zinc-800/30">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${muscleGroupColors[group]}`}>
                  {muscleGroupLabels[group]}
                </span>
              </div>

              {/* Exercises List */}
              {expandedGroups.has(group) && (
                <div className="border-t border-zinc-800">
                  {getExercisesByMuscleGroup(group).map(exercise => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div>
                        <span className="text-white font-medium">{exercise.name}</span>
                        <div className="flex gap-2 mt-1">
                          {exercise.muscles.map(m => (
                            <span key={m} className="text-xs text-zinc-500">{m}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddExercise(exercise.id)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
