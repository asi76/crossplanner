import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowRightLeft, X, ArrowLeft, Edit3, RefreshCw, LogOut } from 'lucide-react';
import { pb } from '../pbService';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { useAuth } from '../hooks/useAuth';
import { showNotification } from './NotificationModal';

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

interface ExerciseLibraryProps {
  onBack: () => void;
}

export function ExerciseLibrary({ onBack }: ExerciseLibraryProps) {
  const { signOut } = useAuth();
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
  const [newGroupColor, setNewGroupColor] = useState('blue');
  const [editingGroup, setEditingGroup] = useState<ExerciseGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupColor, setEditGroupColor] = useState('blue');

  const loadGroups = useCallback(async () => {
    try {
      const records = await pb.collection('exercise_groups').getFullList({ sort: 'sort_order' });
      const mapped: ExerciseGroup[] = records.map((r: any) => ({
        id: r.id,
        name: r.name,
        label: r.name,
        color_class: 'blue',
        sort_order: r.sort_order || 0,
      }));
      setGroups(mapped);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  }, []);

  const loadExercises = useCallback(async () => {
    try {
      const records = await pb.collection('exercises').getFullList({ sort: 'name' });
      const mapped: Exercise[] = records.map((r: any) => ({
        id: r.id,
        group_id: r.group_id || '',
        name: r.name,
        muscles: r.muscles || [],
        reps: r.reps || null,
        duration: r.duration || null,
        difficulty: r.difficulty || 'beginner',
        tipo: r.tipo,
        description: r.description || '',
      }));
      setExercises(mapped);
    } catch (err) {
      console.error('Error loading exercises:', err);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadExercises();
  }, [loadGroups, loadExercises]);

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const maxOrder = groups.reduce((max, g) => Math.max(max, g.sort_order || 0), 0);
      await pb.collection('exercise_groups').create({
        name: newGroupName,
        sort_order: maxOrder + 1,
      });
      setNewGroupName('');
      setShowAddGroup(false);
      loadGroups();
    } catch (err) {
      console.error('Error adding group:', err);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Eliminare questo gruppo?')) return;
    try {
      await pb.collection('exercise_groups').delete(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err) {
      console.error('Error deleting group:', err);
    }
  };

  const updateGroup = async (groupId: string) => {
    try {
      await pb.collection('exercise_groups').update(groupId, { name: editGroupName });
      setEditingGroup(null);
      loadGroups();
    } catch (err) {
      console.error('Error updating group:', err);
    }
  };

  const addExercise = async (groupId: string) => {
    try {
      const newEx = await pb.collection('exercises').create({
        name: 'Nuovo Esercizio',
        group_id: groupId,
        muscles: [],
        difficulty: 'beginner',
        description: '',
      });
      const mapped: Exercise = {
        id: (newEx as any).id,
        group_id: groupId,
        name: 'Nuovo Esercizio',
        muscles: [],
        reps: null,
        duration: null,
        difficulty: 'beginner',
        description: '',
      };
      setExercises(prev => [...prev, mapped]);
      setSelectedExercise(mapped);
      setModalMode('edit');
    } catch (err) {
      console.error('Error adding exercise:', err);
    }
  };

  const updateExercise = async (exerciseId: string, data: Partial<Exercise>) => {
    try {
      await pb.collection('exercises').update(exerciseId, {
        name: data.name,
        description: data.description,
        muscles: data.muscles,
        tipo: data.tipo,
        difficulty: data.difficulty,
        reps: data.reps,
        duration: data.duration,
      });
      setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, ...data } : e));
    } catch (err) {
      console.error('Error updating exercise:', err);
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    try {
      await pb.collection('exercises').delete(exerciseId);
      setExercises(prev => prev.filter(e => e.id !== exerciseId));
    } catch (err) {
      console.error('Error deleting exercise:', err);
    }
  };

  const moveExercise = async (exerciseId: string, newGroupId: string) => {
    try {
      await pb.collection('exercises').update(exerciseId, { group_id: newGroupId });
      setExercises(prev => prev.map(e => e.id === exerciseId ? { ...e, group_id: newGroupId } : e));
      setShowGroupSelector(null);
    } catch (err) {
      console.error('Error moving exercise:', err);
    }
  };

  const handleSaveExercise = async (exercise: Exercise) => {
    await updateExercise(exercise.id, exercise);
    setSelectedExercise(null);
  };

  const COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'pink'];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Libreria Esercizi</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { loadGroups(); loadExercises(); }} className="text-gray-400 hover:text-white p-2">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => signOut()} className="text-gray-400 hover:text-white p-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddGroup(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            + Gruppo
          </button>
        </div>
      </div>

      {/* Groups */}
      <div className="p-4 space-y-3">
        {groups.map(group => (
          <div key={group.id} className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <button
              className="w-full p-4 flex items-center justify-between"
              onClick={() => {
                setExpandedGroups(prev => {
                  const next = new Set(prev);
                  if (next.has(group.id)) next.delete(group.id);
                  else next.add(group.id);
                  return next;
                });
              }}
            >
              <span className="text-white font-medium">{group.label}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); addExercise(group.id); }}
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {expandedGroups.has(group.id) ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {expandedGroups.has(group.id) && (
              <div className="border-t border-dark-border">
                <div className="p-4 space-y-2">
                  {exercises.filter(e => e.group_id === group.id).map(exercise => (
                    <div key={exercise.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                      <div className="flex items-center gap-3">
                        {exercise.gif_url && <img src={exercise.gif_url} className="w-8 h-8 object-contain" alt="" />}
                        <div>
                          <p className="text-white text-sm">{exercise.name}</p>
                          <p className="text-gray-500 text-xs">{exercise.muscles?.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedExercise(exercise); setModalMode('edit'); }} className="text-gray-400 hover:text-white p-1">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteExercise(exercise.id)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setMoveExerciseId(exercise.id); setShowGroupSelector(group.id); }} className="text-gray-400 hover:text-white p-1">
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {exercises.filter(e => e.group_id === group.id).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-2">Nessun esercizio</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nessun gruppo. Clicca "+ Gruppo" per iniziare.</p>
          </div>
        )}
      </div>

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold mb-4">Nuovo Gruppo</h2>
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Nome gruppo"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white mb-4"
              onKeyDown={e => e.key === 'Enter' && addGroup()}
            />
            <div className="flex gap-2 mb-4">
              {COLORS.map(c => (
                <button key={c} onClick={() => setNewGroupColor(c)} className={`w-6 h-6 rounded bg-${c}-500 border-2 ${newGroupColor === c ? 'border-white' : 'border-transparent'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddGroup(false)} className="flex-1 px-4 py-2 text-gray-400 hover:text-white">Annulla</button>
              <button onClick={addGroup} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Crea</button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          mode={modalMode}
          onClose={() => setSelectedExercise(null)}
          onSave={handleSaveExercise}
        />
      )}
    </div>
  );
}
