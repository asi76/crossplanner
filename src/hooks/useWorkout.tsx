import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Workout } from '../data/types';
import { pb } from '../pbService';

interface WorkoutContextType {
  currentWorkout: Workout;
  savedWorkouts: Workout[];
  setCurrentWorkout: (workout: Workout) => void;
  saveWorkout: (workout: Workout) => void;
  loadWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  resetWorkout: () => void;
  loadSavedWorkouts: () => Promise<void>;
  loadingWorkouts: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

const WORKOUT_CATEGORIES = ['forza', 'cardio1', 'cardio2'];

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const loadSavedWorkouts = useCallback(async () => {
    if (!pb.authStore.isValid) return;
    setLoadingWorkouts(true);
    try {
      const records = await pb.collection('workouts').getFullList({
        filter: `user_id="${pb.authStore.model?.id}"`,
        sort: '-created_at'
      });
      const workouts: Workout[] = records.map((r: any) => ({
        id: r.id,
        name: r.name,
        user_id: r.user_id,
        createdAt: r.created,
        stations: r.stations || [],
      }));
      setSavedWorkouts(workouts);
    } catch (err) {
      console.error('Error loading workouts:', err);
    } finally {
      setLoadingWorkouts(false);
    }
  }, []);

  const saveWorkout = useCallback(async (workout: Workout) => {
    try {
      // Build stations data for PocketBase
      const stationsData = (workout.stations || []).map((station, sIdx) => ({
        workout_id: workout.id,
        category_id: WORKOUT_CATEGORIES[sIdx] || 'forza',
        sort_order: sIdx,
      }));

      // Check if workout already exists
      try {
        await pb.collection('workouts').getFirstListItem(`id="${workout.id}"`);
        // Exists — update
        await pb.collection('workouts').update(workout.id, {
          name: workout.name,
        });
      } catch {
        // Doesn't exist — create
        await pb.collection('workouts').create({
          id: workout.id,
          name: workout.name,
          user_id: pb.authStore.model?.id,
          created_at: workout.createdAt || new Date().toISOString(),
        });
      }

      // Delete old stations and recreate
      const existingStations = await pb.collection('workout_stations').getFullList({
        filter: `workout_id="${workout.id}"`
      });
      for (const es of existingStations) {
        await pb.collection('station_exercises').getFullList({
          filter: `station_id="${es.id}"`
        }).then(se => Promise.all(se.map((s: any) =>
          pb.collection('station_exercises').delete(s.id)
        )));
        await pb.collection('workout_stations').delete(es.id);
      }

      // Create new stations with exercises
      for (let sIdx = 0; sIdx < (workout.stations || []).length; sIdx++) {
        const station = workout.stations[sIdx];
        const stationRecord = await pb.collection('workout_stations').create({
          workout_id: workout.id,
          category_id: WORKOUT_CATEGORIES[sIdx] || 'forza',
          sort_order: sIdx,
        });

        for (let eIdx = 0; eIdx < (station.exercises || []).length; eIdx++) {
          const ex = station.exercises[eIdx];
          await pb.collection('station_exercises').create({
            station_id: stationRecord.id,
            exercise_id: ex.exerciseId,
            exercise_name: ex.name || ex.exerciseId,
            sort_order: eIdx,
          });
        }
      }

      setSavedWorkouts(prev => {
        const exists = prev.find(w => w.id === workout.id);
        if (exists) return prev.map(w => w.id === workout.id ? workout : w);
        return [...prev, workout];
      });
    } catch (err) {
      console.error('Error saving workout:', err);
    }
  }, []);

  const loadWorkout = useCallback(async (workout: Workout) => {
    // Load full workout with stations from PocketBase
    try {
      const stations = await pb.collection('workout_stations').getFullList({
        filter: `workout_id="${workout.id}"`,
        sort: 'sort_order'
      });

      const fullStations = await Promise.all(stations.map(async (s: any) => {
        const exercises = await pb.collection('station_exercises').getFullList({
          filter: `station_id="${s.id}"`,
          sort: 'sort_order'
        });
        return {
          id: s.id,
          name: s.category_id, // map category_id to name
          exercises: exercises.map((e: any) => ({
            exerciseId: e.exercise_id,
            name: e.exercise_name,
          })),
        };
      }));

      setCurrentWorkout({ ...workout, stations: fullStations });
    } catch {
      setCurrentWorkout(workout);
    }
  }, []);

  const deleteWorkout = useCallback(async (id: string) => {
    try {
      await pb.collection('workouts').delete(id);
      setSavedWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Error deleting workout:', err);
    }
  }, []);

  const resetWorkout = useCallback(() => {
    setCurrentWorkout(null);
  }, []);

  return (
    <WorkoutContext.Provider value={{
      currentWorkout: currentWorkout as Workout,
      savedWorkouts,
      setCurrentWorkout,
      saveWorkout,
      loadWorkout,
      deleteWorkout,
      resetWorkout,
      loadSavedWorkouts,
      loadingWorkouts,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
}
