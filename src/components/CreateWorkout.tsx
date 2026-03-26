import { useState, useEffect } from 'react';
import { Plus, X, Dumbbell, Trash2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';
import { getGifUrl } from '../data/gifMapping';
import { ExerciseDetailModal } from './ExerciseDetailModal';

interface ExerciseGroup {
  id: string;
  name: string;
  label: string;
  color_class: string;
  sort_order: number;
}

interface Exercise {
  id: string;
  group_id: string;
  name: string;
  muscles: string[];
  reps: number | null;
  duration: number | null;
  difficulty: string;
  tipo?: 'aerobico' | 'anaerobico';
  description: string;
}

interface CreateWorkoutProps {
  onBack: () => void;
  onSave: (workout: any) => void;
}

export function CreateWorkout({ onBack, onSave }: CreateWorkoutProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [stations, setStations] = useState<any[]>([
    { id: '1', name: 'Station 1', exercises: [] }
  ]);
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedExerciseGif, setSelectedExerciseGif] = useState<string | null>(null);

  const currentStation = stations[selectedStationIndex];

  // Load groups and exercises from Supabase
  const loadData = async () => {
    const [groupsRes, exercisesRes] = await Promise.all([
      supabase.from('exercise_groups').select('*').order('sort_order', { ascending: true }),
      supabase.from('exercises').select('*')
    ]);
    
    if (groupsRes.data) setGroups(groupsRes.data);
    if (exercisesRes.data) setExercises(exercisesRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get exercises for a specific group (sorted alphabetically)
  const getExercisesByGroup = (groupId: string): Exercise[] => {
    return exercises
      .filter(e => e.group_id === groupId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleOpenExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    try {
      const gifUrl = await getGifUrl(exercise.id);
      setSelectedExerciseGif(gifUrl);
    } catch {
      setSelectedExerciseGif(null);
    }
  };

  const handleGifUpdated = (exerciseId: string, newUrl: string | null) => {
    if (selectedExercise?.id === exerciseId) {
      setSelectedExerciseGif(newUrl);
    }
  };

  const handleAddStation = () => {
    const newStation = {
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

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise = {
      exerciseId: exercise.id,
      sets: exercise.reps ? 3 : 4,
      reps: exercise.reps || 10,
      rest: 60,
      exerciseName: exercise.name
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

    const workout = {
      id: Date.now().toString(),
      name: workoutName,
      stations: stations.filter(s => s.exercises.length > 0),
      createdAt: new Date().toISOString()
    };

    // Save to Supabase
    await supabase.from('workouts').insert(workout);

    onSave(workout);
    setWorkoutName('');
    setStations([{ id: '1', name: 'Station 1', exercises: [] }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Crea Workout</h2>
          <p className="text-base text-zinc-400">Aggiungi esercizi dal database</p>
        </div>
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
        <button
          onClick={handleAddStation}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Station
        </button>
      </div>

      {/* Current Station Exercises */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <h3 className="text-white font-semibold mb-3">{currentStation.name}</h3>
        
        {currentStation.exercises.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nessun esercizio. Aggiungi dalla lista sotto.</p>
        ) : (
          <div className="space-y-2">
            {currentStation.exercises.map((ex: any, index: number) => (
              <div key={index} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                <button
                  onClick={() => {
                    const exData = exercises.find(e => e.id === ex.exerciseId);
                    if (exData) handleOpenExercise(exData);
                  }}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <Dumbbell className="w-5 h-5 text-emerald-400" />
                  <span className="text-white font-medium">{ex.exerciseName || ex.exerciseId}</span>
                </button>
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
            ))}
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

      {/* Exercise Library - Same style as ExerciseLibrary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Libreria Esercizi</h3>
        
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded text-sm font-semibold border ${group.color_class}`}>
                    {group.label}
                  </span>
                  <span className="text-base text-zinc-400">
                    {getExercisesByGroup(group.id).length} esercizi
                  </span>
                </div>
                {expandedGroups.has(group.id) ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </button>

              {/* Exercises List */}
              {expandedGroups.has(group.id) && (
                <div className="border-t border-zinc-800 max-h-96 overflow-y-auto scrollbar-dark">
                  {getExercisesByGroup(group.id).length === 0 ? (
                    <div className="px-5 py-8 text-center text-zinc-500">
                      Nessun esercizio
                    </div>
                  ) : (
                    getExercisesByGroup(group.id).map(exercise => (
                      <div
                        key={exercise.id}
                        className="px-5 py-4 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleOpenExercise(exercise)}
                            className="flex-1 text-left"
                          >
                            <span className="text-white font-medium">{exercise.name}</span>
                            <div className="flex gap-2 mt-1">
                              {exercise.muscles?.map((muscle: string, idx: number) => (
                                <span key={idx} className="text-xs text-zinc-500">{muscle}</span>
                              ))}
                            </div>
                          </button>
                          <button
                            onClick={() => handleAddExercise(exercise)}
                            className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors ml-2"
                          >
                            <Plus className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          gifUrl={selectedExerciseGif}
          onClose={() => setSelectedExercise(null)}
          onGifUpdated={handleGifUpdated}
          showUpload={true}
        />
      )}
    </div>
  );
}
