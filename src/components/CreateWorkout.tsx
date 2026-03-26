import { useState, useEffect } from 'react';
import { Plus, X, Dumbbell, Trash2, ChevronDown, ChevronUp, ArrowLeft, Target, Image } from 'lucide-react';
import { supabase } from '../supabase';
import { getGifUrl } from '../data/gifMapping';
import { Workout } from '../data/types';

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
  editWorkout?: Workout | null;
}

// Fixed workout categories
const WORKOUT_CATEGORIES = [
  { id: 'forza', name: 'Forza' },
  { id: 'cardio1', name: 'Cardio 1' },
  { id: 'cardio2', name: 'Cardio 2' }
];

export function CreateWorkout({ onBack, onSave, editWorkout }: CreateWorkoutProps) {
  const [workoutName, setWorkoutName] = useState(editWorkout?.name || '');
  const [workoutCategories, setWorkoutCategories] = useState<any[]>(
    editWorkout?.stations || [
      { id: 'forza', name: 'Forza', exercises: [] },
      { id: 'cardio1', name: 'Cardio 1', exercises: [] },
      { id: 'cardio2', name: 'Cardio 2', exercises: [] }
    ]
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState('forza');
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [viewingExerciseGif, setViewingExerciseGif] = useState<string | null>(null);

  const currentCategory = workoutCategories.find(c => c.id === selectedCategoryId)!;

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

  // Add exercise to current category and collapse the group it belongs to
  const handleAddExercise = (exercise: Exercise, groupId: string) => {
    const newExercise = {
      exerciseId: exercise.id,
      sets: exercise.reps ? 3 : 4,
      reps: exercise.reps || 10,
      rest: 60,
      exerciseName: exercise.name
    };

    const newCategories = [...workoutCategories];
    const catIndex = newCategories.findIndex(c => c.id === selectedCategoryId);
    if (catIndex !== -1) {
      newCategories[catIndex].exercises.push(newExercise);
      setWorkoutCategories(newCategories);
    }

    // Collapse the group after adding
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  };

  const handleRemoveExercise = (categoryId: string, exerciseIndex: number) => {
    const newCategories = [...workoutCategories];
    const catIndex = newCategories.findIndex(c => c.id === categoryId);
    if (catIndex !== -1) {
      newCategories[catIndex].exercises.splice(exerciseIndex, 1);
      setWorkoutCategories(newCategories);
    }
  };

  // View exercise
  const handleViewExercise = async (exercise: Exercise) => {
    setViewingExerciseGif(null);
    setViewingExercise(exercise);
    try {
      const gifUrl = await getGifUrl(exercise.id);
      setViewingExerciseGif(gifUrl);
    } catch {
      setViewingExerciseGif(null);
    }
  };

  const handleSave = async () => {
    if (!workoutName.trim() || workoutCategories.every(s => s.exercises.length === 0)) {
      alert('Inserisci un nome e aggiungi almeno un esercizio');
      return;
    }

    const workout = {
      id: Date.now().toString(),
      name: workoutName,
      stations: workoutCategories.filter(s => s.exercises.length > 0),
      createdAt: new Date().toISOString()
    };

    await supabase.from('workouts').insert(workout);

    onSave(workout);
    setWorkoutName('');
    setWorkoutCategories(WORKOUT_CATEGORIES.map(c => ({ ...c, exercises: [] })));
  };

  const getExerciseById = (id: string) => exercises.find(e => e.id === id);

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
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
      />

      {/* Category Tabs - Fixed Forza, Cardio 1, Cardio 2 */}
      <div className="flex gap-2">
        {WORKOUT_CATEGORIES.map((cat) => {
          const catData = workoutCategories.find(c => c.id === cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {cat.name} ({catData?.exercises.length || 0})
            </button>
          );
        })}
      </div>

      {/* Current Category Exercises */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <h3 className="text-white font-semibold mb-3">{currentCategory.name}</h3>
        
        {currentCategory.exercises.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nessun esercizio. Aggiungi dalla lista sotto.</p>
        ) : (
          <div className="space-y-2">
            {currentCategory.exercises.map((ex: any, index: number) => {
              const exerciseData = getExerciseById(ex.exerciseId);
              return (
                <div key={index} className="flex items-center justify-between bg-zinc-800 rounded-lg p-3">
                  <button
                    onClick={() => exerciseData && handleViewExercise(exerciseData)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <Dumbbell className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">{ex.exerciseName || ex.exerciseId}</span>
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 text-sm">
                      {ex.sets} x {ex.reps}
                    </span>
                    <button
                      onClick={() => handleRemoveExercise(selectedCategoryId, index)}
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
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
      >
        Salva Workout
      </button>

      {/* Exercise Library - Groups collapsible */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Libreria Esercizi</h3>
        
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              {/* Group Header - click anywhere to expand/collapse */}
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

              {/* Exercises List - shown when expanded, same style as ExerciseLibrary */}
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
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => handleViewExercise(exercise)}
                                className="text-base font-medium text-white hover:text-blue-400 cursor-pointer transition-colors text-left"
                              >
                                {exercise.name}
                              </button>
                              <span className={`text-xs px-1.5 py-0.5 rounded ml-2 ${
                                exercise.tipo === 'aerobico' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {exercise.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex flex-wrap gap-x-2">
                                {exercise.muscles.map((muscle, idx) => (
                                  <span key={idx} className="text-xs text-zinc-500">{muscle}</span>
                                ))}
                              </div>
                              <span className={`text-xs px-1.5 py-0.5 rounded ml-2 ${
                                exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {exercise.difficulty === 'beginner' ? 'Principiante' :
                                 exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddExercise(exercise, group.id)}
                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors ml-2"
                            title="Aggiungi"
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
                <Target className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-white">{viewingExercise.name}</h2>
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
                    alt={viewingExercise.name} 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-zinc-500 text-center">
                    <Image className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessuna immagine</p>
                  </div>
                )}
              </div>

              {/* Right - Info */}
              <div className="md:w-1/2 p-6 overflow-y-auto modal-scroll">
                <div className="space-y-4">
                  {/* Descrizione */}
                  <div>
                    <h3 className="text-xs font-medium text-zinc-500 mb-1.5">Descrizione</h3>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {viewingExercise.description || 'Nessuna descrizione disponibile.'}
                    </p>
                  </div>

                  {/* Muscoli */}
                  <div>
                    <h3 className="text-xs font-medium text-zinc-500 mb-1.5">Muscoli</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingExercise.muscles?.map((muscle, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tipo e Difficolta */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      viewingExercise.tipo === 'aerobico' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {viewingExercise.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      viewingExercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      viewingExercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {viewingExercise.difficulty === 'beginner' ? 'Principiante' :
                       viewingExercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                    </span>
                    {(viewingExercise.reps || viewingExercise.duration) && (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">
                        {viewingExercise.reps ? `${viewingExercise.reps} reps` : `${viewingExercise.duration}s`}
                      </span>
                    )}
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
