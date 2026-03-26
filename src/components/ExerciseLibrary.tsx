import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowRightLeft, X, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';
import { ExerciseDetailModal } from './ExerciseDetailModal';

const SUPABASE_URL = 'https://kdsstxsthxusgcizzmpr.supabase.co';

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
  description: string;
}

interface ExerciseLibraryProps {
  onBack: () => void;
}

export function ExerciseLibrary({ onBack }: ExerciseLibraryProps) {
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedExerciseGif, setSelectedExerciseGif] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [createGroupId, setCreateGroupId] = useState<string | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState<string | null>(null);
  const [moveExerciseId, setMoveExerciseId] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Load groups from Supabase
  const loadGroups = useCallback(async () => {
    const { data, error } = await supabase
      .from('exercise_groups')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (!error && data) {
      setGroups(data);
    }
  }, []);

  // Load exercises from Supabase
  const loadExercises = useCallback(async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');
    
    if (!error && data) {
      setExercises(data);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadExercises();
  }, [loadGroups, loadExercises]);

  // Get exercises for a specific group (sorted alphabetically)
  const getExercisesByGroup = (groupId: string): Exercise[] => {
    return exercises
      .filter(e => e.group_id === groupId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Delete exercise
  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('Eliminare questo esercizio?')) return;
    
    await supabase.from('exercises').delete().eq('id', exerciseId);
    loadExercises();
  };

  // Move exercise to another group
  const moveExercise = async (exerciseId: string, newGroupId: string) => {
    await supabase.from('exercises').update({ group_id: newGroupId }).eq('id', exerciseId);
    setShowGroupSelector(null);
    setMoveExerciseId(null);
    loadExercises();
  };

  // Add new exercise
  const handleAddExercise = (groupId: string) => {
    setCreateGroupId(groupId);
    setSelectedExercise(null);
    setModalMode('create');
  };

  // Edit exercise - load GIF too
  const handleEditExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCreateGroupId(null);
    setModalMode('edit');
    // Load GIF
    try {
      const gifUrl = await getGifUrl(exercise.id);
      setSelectedExerciseGif(gifUrl);
    } catch {
      setSelectedExerciseGif(null);
    }
  };

  // Called when user clicks Modifica in the modal
  const handleOpenEdit = () => {
    setModalMode('edit');
  };

  // View exercise - load GIF too
  const handleViewExercise = async (exercise: Exercise) => {
    setSelectedExerciseGif(null); // Reset first
    setSelectedExercise(exercise);
    setCreateGroupId(null);
    setModalMode('view');
    // Load GIF
    try {
      const gifUrl = await getGifUrl(exercise.id);
      setSelectedExerciseGif(gifUrl);
    } catch {
      setSelectedExerciseGif(null);
    }
  };

  // Close modal - reload exercises to show updated data and clear GIF
  const handleCloseModal = () => {
    setSelectedExercise(null);
    setSelectedExerciseGif(null);
    setCreateGroupId(null);
    setModalMode('view');
    loadExercises();
  };

  // Save exercise (create or update)
  const handleSaveExercise = async (exerciseData: Partial<Exercise>) => {
    try {
      if (modalMode === 'create' && createGroupId) {
        const newId = `${createGroupId}-${Date.now()}`;
        const { error } = await supabase.from('exercises').insert({
          id: newId,
          group_id: createGroupId,
          name: exerciseData.name || '',
          muscles: exerciseData.muscles || [],
          reps: exerciseData.reps || null,
          duration: exerciseData.duration || null,
          difficulty: exerciseData.difficulty || 'intermediate',
          description: exerciseData.description || ''
        });
        
        if (error) {
          console.error('Error creating exercise:', error);
          alert('Errore: ' + error.message);
          return;
        }
      } else if (modalMode === 'edit' && selectedExercise) {
        const { error } = await supabase.from('exercises').update({
          name: exerciseData.name,
          muscles: exerciseData.muscles,
          reps: exerciseData.reps,
          duration: exerciseData.duration,
          difficulty: exerciseData.difficulty,
          description: exerciseData.description
        }).eq('id', selectedExercise.id);
        
        if (error) {
          console.error('Error updating exercise:', error);
          alert('Errore: ' + error.message);
          return;
        }
      }
      
      loadExercises();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving exercise:', err);
      alert('Errore durante il salvataggio');
    }
  };

  // Add new group
  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const id = newGroupName.toLowerCase().replace(/\s+/g, '-');
    await supabase.from('exercise_groups').insert({
      id,
      name: newGroupName,
      label: newGroupName,
      color_class: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      sort_order: groups.length + 1
    });
    setNewGroupName('');
    setShowAddGroup(false);
    loadGroups();
  };

  // Group selector modal
  const renderGroupSelector = () => {
    if (!showGroupSelector) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Sposta esercizio</h2>
            <button
              onClick={() => {
                setShowGroupSelector(null);
                setMoveExerciseId(null);
              }}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => moveExerciseId && moveExercise(moveExerciseId, group.id)}
                className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors"
              >
                <span className={`px-3 py-1 rounded text-sm font-semibold border ${group.color_class}`}>
                  {group.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add group modal
  const renderAddGroupModal = () => {
    if (!showAddGroup) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Aggiungi Gruppo</h2>
            <button
              onClick={() => {
                setShowAddGroup(false);
                setNewGroupName('');
              }}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome del gruppo"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && addGroup()}
            />
            <button
              onClick={addGroup}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Default exercise for create mode
  const defaultExercise: Exercise = {
    id: '',
    group_id: createGroupId || '',
    name: '',
    muscles: [],
    reps: null,
    duration: null,
    difficulty: 'intermediate',
    description: ''
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
          <h2 className="text-2xl font-bold text-white">Libreria Esercizi</h2>
          <p className="text-base text-zinc-400">Gestisci esercizi e gruppi muscolari</p>
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {groups.map(group => (
          <div key={group.id} className="bg-zinc-900 rounded-xl border border-zinc-800">
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
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddExercise(group.id);
                  }}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                  title="Aggiungi esercizio"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
                {expandedGroups.has(group.id) ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {expandedGroups.has(group.id) && (
              <div className="border-t border-zinc-800 max-h-96 overflow-y-auto">
                {getExercisesByGroup(group.id).length === 0 ? (
                  <div className="px-5 py-8 text-center text-zinc-500">
                    Nessun esercizio in questo gruppo
                  </div>
                ) : (
                  getExercisesByGroup(group.id).map(exercise => (
                    <div
                      key={exercise.id}
                      className="px-5 py-4 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <button
                            onClick={() => handleViewExercise(exercise)}
                            className="text-lg font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
                          >
                            {exercise.name}
                          </button>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {exercise.muscles.map((muscle, idx) => (
                              <span key={idx} className="text-sm text-zinc-500">{muscle}</span>
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
                            {exercise.difficulty === 'beginner' ? 'Principiante' :
                             exercise.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                          </span>
                          <button
                            onClick={() => {
                              setMoveExerciseId(exercise.id);
                              setShowGroupSelector(exercise.id);
                            }}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Sposta"
                          >
                            <ArrowRightLeft className="w-4 h-4 text-zinc-400" />
                          </button>
                          <button
                            onClick={() => deleteExercise(exercise.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {/* Add exercise button at bottom of group */}
                <div className="px-5 py-3 border-t border-zinc-800/50">
                  <button
                    onClick={() => handleAddExercise(group.id)}
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi esercizio
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Group Button */}
      <button
        onClick={() => setShowAddGroup(true)}
        className="w-full px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-emerald-400 font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Aggiungi Gruppo
      </button>

      {/* Exercise Modal */}
      {(selectedExercise || modalMode === 'create') && (
        <ExerciseDetailModal
          exercise={modalMode === 'create' ? defaultExercise : selectedExercise!}
          mode={modalMode}
          gifUrl={selectedExerciseGif}
          onClose={handleCloseModal}
          onSave={handleSaveExercise}
          onEdit={handleOpenEdit}
          onGifUpdated={(id, url) => setSelectedExerciseGif(url)}
        />
      )}

      {/* Group Selector Modal */}
      {renderGroupSelector()}

      {/* Add Group Modal */}
      {renderAddGroupModal()}
    </div>
  );
}
