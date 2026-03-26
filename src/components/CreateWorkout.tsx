import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Dumbbell, Clock, Trash2, Search } from 'lucide-react';
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
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<MuscleGroup | null>('upper-push');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSave = () => {
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

    onSave(workout);
    setWorkoutName('');
    setStations([{ id: '1', name: 'Station 1', exercises: [] }]);
  };

  const getExerciseById = (id: string) => exercises.find(e => e.id === id);

  const filteredExercises = searchQuery
    ? exercises.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.muscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

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
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">{currentStation.name}</h3>
          <button
            onClick={() => setShowExercisePicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            Cerca Esercizi
          </button>
        </div>
        
        {currentStation.exercises.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nessun esercizio. Clicca "Cerca Esercizi" per aggiungerne.</p>
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

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60"
          onClick={() => setShowExercisePicker(false)}
        >
          <div 
            className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-xl max-h-[70vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca esercizio..."
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  onClick={() => setShowExercisePicker(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Exercise List */}
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              {searchQuery ? (
                // Search results
                filteredExercises.length > 0 ? (
                  <div className="p-2">
                    {filteredExercises.map(exercise => (
                      <button
                        key={exercise.id}
                        onClick={() => {
                          handleAddExercise(exercise.id);
                          setShowExercisePicker(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <div className="text-left">
                          <span className="text-white font-medium">{exercise.name}</span>
                          <div className="flex gap-2 mt-1">
                            {exercise.muscles.map(m => (
                              <span key={m} className="text-xs text-zinc-500">{m}</span>
                            ))}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-emerald-400" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-500">
                    Nessun esercizio trovato
                  </div>
                )
              ) : (
                // Grouped by muscle group
                <div className="p-2 space-y-2">
                  {muscleGroups.map(group => (
                    <div key={group}>
                      <button
                        onClick={() => setExpandedGroup(expandedGroup === group ? null : group)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                      >
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${muscleGroupColors[group]}`}>
                          {muscleGroupLabels[group]}
                        </span>
                        {expandedGroup === group ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                      
                      {expandedGroup === group && (
                        <div className="ml-2 mt-1 space-y-1">
                          {getExercisesByMuscleGroup(group).map(exercise => (
                            <button
                              key={exercise.id}
                              onClick={() => {
                                handleAddExercise(exercise.id);
                                setShowExercisePicker(false);
                              }}
                              className="w-full flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <div className="text-left">
                                <span className="text-white text-sm">{exercise.name}</span>
                                <div className="flex gap-2 mt-0.5">
                                  {exercise.muscles.map(m => (
                                    <span key={m} className="text-xs text-zinc-500">{m}</span>
                                  ))}
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-emerald-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
