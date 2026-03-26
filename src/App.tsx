import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Plus, 
  Library, 
  Save, 
  LogOut, 
  Shield,
  Play,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useWorkout } from './hooks/useWorkout';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { CreateWorkout } from './components/CreateWorkout';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { SavedWorkouts } from './components/SavedWorkouts';
import { WorkoutDisplay } from './components/WorkoutDisplay';
import { Workout } from './data/types';

type View = 'home' | 'create' | 'library' | 'saved' | 'workout' | 'admin';

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

  if (currentView === 'saved') {
    return (
      <SavedWorkouts
        workouts={savedWorkouts}
        onLoad={(workout) => handleStartWorkout(workout)}
        onDelete={deleteWorkout}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  // Home view
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
            Saved Workouts
          </h2>
          <button
            onClick={() => setCurrentView('saved')}
            className="text-blue-400 text-sm font-medium hover:text-blue-400"
          >
            View All ({savedWorkouts.length})
          </button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedWorkouts.slice(0, 6).map((workout, idx) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-blue-500/50 transition-colors"
              >
                <h3 className="text-white font-medium mb-2 truncate">{workout.name}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {workout.stations.filter(s => s.exercises.length > 0).length} stations • {' '}
                  {workout.stations.reduce((acc, s) => acc + s.exercises.length, 0)} exercises
                </p>
                <button
                  onClick={() => handleStartWorkout(workout)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
