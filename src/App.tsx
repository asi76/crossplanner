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
  ChevronUp
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useWorkout } from './hooks/useWorkout';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { CreateWorkout } from './components/CreateWorkout';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutDisplay } from './components/WorkoutDisplay';
import { Workout } from './data/types';

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
  const [viewingExercise, setViewingExercise] = useState<any>(null);

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
        onSave={(workout) => {
          saveWorkout(workout);
          setCurrentView('home');
        }}
        onStart={(workout) => {
          handleStartWorkout(workout);
        }}
        onBack={() => setCurrentView('home')}
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
                {/* Workout Header - Always Visible */}
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
                        setExpandedWorkoutId(expandedWorkoutId === workout.id ? null : workout.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                      {expandedWorkoutId === workout.id ? (
                        <>
                          <X className="w-4 h-4" />
                          Chiudi
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Mostra
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Eliminare questo workout?')) {
                          deleteWorkout(workout.id);
                        }
                      }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                    </button>
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
                      {/* Category Tabs */}
                      <div className="flex gap-2 p-4 border-b border-dark-border">
                        {WORKOUT_CATEGORIES.map((cat) => {
                          const exercises = getExercisesByCategory(workout, cat.id);
                          return (
                            <div key={cat.id} className="flex-1">
                              <div className="text-center mb-2">
                                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                  exercises.length > 0 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'bg-dark-bg text-gray-500'
                                }`}>
                                  {cat.name} ({exercises.length})
                                </span>
                              </div>
                              {/* Exercise List */}
                              <div className="space-y-2">
                                {exercises.map((ex: any, index: number) => (
                                  <div 
                                    key={index}
                                    onClick={() => setViewingExercise(ex)}
                                    className="bg-dark-bg rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Dumbbell className="w-4 h-4 text-blue-400" />
                                      <span className="text-white text-sm font-medium">
                                        {ex.exerciseName || ex.exerciseId}
                                      </span>
                                    </div>
                                    <span className="text-gray-400 text-sm">
                                      {ex.sets} x {ex.reps}
                                    </span>
                                  </div>
                                ))}
                                {exercises.length === 0 && (
                                  <div className="text-gray-600 text-xs text-center py-2">
                                    Nessun esercizio
                                  </div>
                                )}
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

      {/* Exercise Info Modal */}
      {viewingExercise && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setViewingExercise(null)}
        >
          <div 
            className="bg-dark-card rounded-2xl border border-dark-border w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">
                  {viewingExercise.exerciseName || viewingExercise.exerciseId}
                </h2>
              </div>
              <button
                onClick={() => setViewingExercise(null)}
                className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-white font-semibold text-xl">
                  {viewingExercise.sets} x {viewingExercise.reps}
                </span>
                {viewingExercise.rest && (
                  <span className="text-gray-400 text-sm">
                    {viewingExercise.rest}s pausa
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setViewingExercise(null);
                  setExpandedWorkoutId(null);
                  handleStartWorkout(viewingExercise);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Avvia Esercizio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
