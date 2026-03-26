import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, 
  Plus, 
  Library, 
  Save, 
  LogOut, 
  Shield,
  Play,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Target,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useWorkout } from './hooks/useWorkout';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { CreateWorkout } from './components/CreateWorkout';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutDisplay } from './components/WorkoutDisplay';
import { Workout } from './data/types';
import { supabase } from './supabase';
import { getGifUrl } from './data/gifMapping';

type View = 'home' | 'create' | 'library' | 'workout' | 'admin';

const WORKOUT_CATEGORIES = [
  { id: 'forza', name: 'Forza' },
  { id: 'cardio1', name: 'Cardio 1' },
  { id: 'cardio2', name: 'Cardio 2' }
];

function App() {
  const { user, role, loading, signOut } = useAuth();
  const {
    savedWorkouts,
    loadSavedWorkouts,
    saveWorkout,
    deleteWorkout
  } = useWorkout();
  const [currentView, setCurrentView] = useState<View>('home');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('forza');
  const [viewingExercise, setViewingExercise] = useState<any>(null);
  const [viewingExerciseData, setViewingExerciseData] = useState<any>(null);
  const [viewingExerciseGif, setViewingExerciseGif] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [allExercises, setAllExercises] = useState<any[]>([]);

  // Load all exercises for display (muscles, tipo, difficulty)
  useEffect(() => {
    async function loadExercises() {
      const { data } = await supabase.from('exercises').select('*');
      if (data) setAllExercises(data);
    }
    loadExercises();
  }, []);

  useEffect(() => {
    if (role === 'enabled' || role === 'admin') {
      loadSavedWorkouts();
    }
  }, [role, loadSavedWorkouts]);

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    setCurrentView('workout');
  };

  const handleWorkoutComplete = () => {
    setActiveWorkout(null);
    setCurrentView('home');
  };

  const handleExitWorkout = () => {
    setActiveWorkout(null);
    setCurrentView('home');
  };

  const getExercisesByCategory = (workout: Workout, categoryId: string) => {
    const category = workout.stations.find((s: any) => s.id === categoryId);
    return category?.exercises || [];
  };

  const getExerciseById = (id: string) => {
    return allExercises.find(e => e.id === id);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Dumbbell className="w-12 h-12 text-blue-400" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (role === 'pending') {
    return (
      <Login isPendingUser pendingEmail={user?.email || undefined} />
    );
  }

  if (currentView === 'admin') {
    return (
      <div>
        <AdminPanel />
        <button
          onClick={() => setCurrentView('home')}
          className="fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <Dumbbell className="w-5 h-5" />
          Back to App
        </button>
      </div>
    );
  }

  if (currentView === 'workout' && activeWorkout) {
    return (
      <WorkoutDisplay 
        workout={activeWorkout} 
        onComplete={handleWorkoutComplete}
        onExit={handleExitWorkout}
      />
    );
  }

  if (currentView === 'create') {
    return (
      <CreateWorkout
        editWorkout={editingWorkout}
        onSave={(workout) => {
          saveWorkout(workout);
          setEditingWorkout(null);
          setCurrentView('home');
        }}
        onStart={(workout) => {
          handleStartWorkout(workout);
        }}
        onBack={() => {
          setEditingWorkout(null);
          setCurrentView('home');
        }}
      />
    );
  }

  if (currentView === 'library') {
    return (
      <ExerciseLibrary onBack={() => setCurrentView('home')} />
    );
  }

  // Home view with inline expandable workout cards
  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Dumbbell className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Crosstraining</h1>
              <p className="text-gray-400 text-sm">Welcome, {user.displayName?.split(' ')[0] || 'Athlete'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className="p-2 bg-dark-card border border-dark-border rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Admin Panel"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-dark-card border border-dark-border rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={signOut}
              className="p-2 bg-dark-card border border-dark-border rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('create')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-left group"
          >
            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold text-xl mb-1">Create Workout</h3>
            <p className="text-blue-200 text-sm">Build a custom crosstraining session</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentView('library')}
            className="bg-dark-card border border-dark-border rounded-2xl p-6 text-left group hover:border-blue-500/50 transition-colors"
          >
            <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
              <Library className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-1">Exercise Library</h3>
            <p className="text-gray-400 text-sm">Browse 65+ exercises across 6 stations</p>
          </motion.button>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Save className="w-5 h-5 text-gray-400" />
            Saved Workouts ({savedWorkouts.length})
          </h2>
        </div>

        {savedWorkouts.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
            <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No saved workouts yet</p>
            <p className="text-gray-500 text-sm mb-4">Create your first workout to get started</p>
            <button
              onClick={() => setCurrentView('create')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Create Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedWorkouts.map((workout, idx) => (
              <motion.div
                key={workout.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-dark-card border rounded-xl overflow-hidden transition-colors ${
                  expandedWorkoutId === workout.id 
                    ? 'border-blue-500 w-full' 
                    : 'border-dark-border hover:border-blue-500/50'
                }`}
              >
                {/* Workout Header - clickable to expand */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => setExpandedWorkoutId(expandedWorkoutId === workout.id ? null : workout.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {expandedWorkoutId === workout.id ? (
                      <ChevronUp className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-white font-semibold">{workout.name}</h3>
                      <span className="text-gray-500 text-sm">
                        {formatDate(workout.createdAt)} • {' '}
                        {workout.stations.reduce((acc, s) => acc + s.exercises.length, 0)} esercizi
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Eliminare questo workout?')) {
                          if (confirm('Conferma eliminazione definitiva?')) {
                            deleteWorkout(workout.id);
                          }
                        }
                      }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkout(workout);
                        setCurrentView('create');
                      }}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Pencil className="w-5 h-5 text-blue-400" />
                    </button>
                    {expandedWorkoutId === workout.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedWorkoutId(null);
                        }}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                        title="Chiudi"
                      >
                        <X className="w-5 h-5 text-gray-300" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedWorkoutId === workout.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-dark-border"
                    >
                      {/* Category Tabs - same style as CreateWorkout */}
                      <div className="flex gap-2 p-4 border-b border-dark-border">
                        {WORKOUT_CATEGORIES.map((cat) => {
                          const exercises = getExercisesByCategory(workout, cat.id);
                          const isSelected = selectedCategoryId === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategoryId(cat.id)}
                              className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : exercises.length > 0
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    : 'bg-dark-bg text-gray-500'
                              }`}
                            >
                              {cat.name} ({exercises.length})
                            </button>
                          );
                        })}
                      </div>

                      {/* Exercise List - fixed height container, no dumbbell icon */}
                      <div className="p-4 min-h-[200px]">
                        {getExercisesByCategory(workout, selectedCategoryId).map((ex: any, index: number) => {
                          const exerciseData = getExerciseById(ex.exerciseId);
                          return (
                            <div 
                              key={index}
                              onClick={async () => {
                                setViewingExercise(ex);
                                setViewingExerciseData(exerciseData);
                                setViewingExerciseGif(null);
                                try {
                                  const gifUrl = await getGifUrl(ex.exerciseId);
                                  setViewingExerciseGif(gifUrl);
                                } catch {}
                              }}
                              className="bg-dark-bg rounded-lg p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors w-full mb-2 last:mb-0"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-white text-sm font-medium">
                                  {ex.exerciseName || ex.exerciseId}
                                </span>
                                <div className="flex items-center gap-1">
                                  {exerciseData?.muscles?.slice(0, 3).map((m: string, i: number) => (
                                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-gray-300">{m}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Info Modal - same style as CreateWorkout */}
      {viewingExercise && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setViewingExercise(null)}
        >
          <div 
            className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-white">
                  {viewingExercise.exerciseName || viewingExercise.exerciseId}
                </h2>
              </div>
              <button
                onClick={() => setViewingExercise(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="flex flex-col md:flex-row max-h-[calc(80vh-70px)]">
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
              <div className="md:w-1/2 p-6 overflow-y-auto modal-scroll">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Descrizione</h3>
                    <p className="text-zinc-300 text-base leading-relaxed">
                      {viewingExerciseData?.description || 'Nessuna descrizione disponibile.'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Muscoli</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingExerciseData?.muscles?.map((muscle: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 rounded text-sm bg-white/20 text-white border border-white/30">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-3 py-1 rounded ${
                      viewingExerciseData?.tipo === 'aerobico' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {viewingExerciseData?.tipo === 'aerobico' ? 'Aerobico' : 'Anaerobico'}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded ${
                      viewingExerciseData?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      viewingExerciseData?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {viewingExerciseData?.difficulty === 'beginner' ? 'Principiante' :
                       viewingExerciseData?.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzato'}
                    </span>
                    {(viewingExerciseData?.reps || viewingExerciseData?.duration) && (
                      <span className="text-sm px-3 py-1 rounded bg-zinc-700 text-zinc-300">
                        {viewingExerciseData?.reps ? `${viewingExerciseData.reps} reps` : `${viewingExerciseData?.duration}s`}
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

export default App;
