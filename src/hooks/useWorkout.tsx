import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { fetchWorkouts, createWorkout as apiCreateWorkout, deleteWorkout as apiDeleteWorkout, fetchStations, createStation as apiCreateStation, deleteStations as apiDeleteStations, fetchStationExercises, createStationExercise as apiCreateStationExercise, deleteStationExercises as apiDeleteStationExercises, isLoggedIn } from '../pbService';

interface Station {
    id: string;
    workout_id: string;
    category_id: string;
    sort_order: number;
    exercises?: any[];
}

interface Workout {
    id: string;
    name: string;
    user_id: string;
    created_at?: string;
    stations?: Station[];
}

interface WorkoutContextType {
    currentWorkout: Workout | null;
    savedWorkouts: Workout[];
    setCurrentWorkout: (w: Workout) => void;
    saveWorkout: (w: Workout) => Promise<void>;
    loadWorkout: (w: Workout) => void;
    deleteWorkout: (id: string) => Promise<void>;
    resetWorkout: () => void;
    loadSavedWorkouts: () => Promise<void>;
    loadingWorkouts: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
    const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
    const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
    const [loadingWorkouts, setLoadingWorkouts] = useState(false);

    const loadSavedWorkouts = useCallback(async () => {
        if (!isLoggedIn()) return;
        setLoadingWorkouts(true);
        try {
            const workouts = await fetchWorkouts();
            setSavedWorkouts(workouts.map((w: any) => ({ ...w, stations: [] })));
        } catch (err) {
            console.error('Error loading workouts:', err);
        } finally {
            setLoadingWorkouts(false);
        }
    }, []);

    const loadWorkout = useCallback(async (workout: Workout) => {
        try {
            const stations = await fetchStations(workout.id);
            const fullStations = await Promise.all(stations.map(async (s: any) => {
                const exercises = await fetchStationExercises(s.id);
                return { ...s, exercises };
            }));
            setCurrentWorkout({ ...workout, stations: fullStations });
        } catch (err) {
            setCurrentWorkout(workout);
        }
    }, []);

    const saveWorkout = useCallback(async (workout: Workout) => {
        try {
            // Save or update workout
            if (workout.id) {
                await apiCreateWorkout({ id: workout.id, name: workout.name });
            }
            // Delete old stations and recreate
            await deleteStations(workout.id);
            for (const station of workout.stations || []) {
                const s = await apiCreateStation({ workout_id: workout.id, category_id: station.category_id, sort_order: station.sort_order });
                for (let i = 0; i < (station.exercises || []).length; i++) {
                    const ex = station.exercises[i];
                    await apiCreateStationExercise({ station_id: s.id, exercise_id: ex.exerciseId, exercise_name: ex.name, sort_order: i });
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

    const deleteWorkout = useCallback(async (id: string) => {
        try {
            await apiDeleteWorkout(id);
            setSavedWorkouts(prev => prev.filter(w => w.id !== id));
        } catch (err) {
            console.error('Error deleting workout:', err);
        }
    }, []);

    const resetWorkout = useCallback(() => setCurrentWorkout(null), []);

    return (
        <WorkoutContext.Provider value={{
            currentWorkout,
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
