import { useState, useCallback } from 'react';
import { Workout, Station } from '../data/types';
import { supabase } from '../supabase';

export const useWorkout = () => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);

  const loadSavedWorkouts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading workouts:', error);
        return;
      }
      
      if (data) {
        const workouts: Workout[] = data.map(w => ({
          id: w.id,
          name: w.name,
          stations: w.stations || [],
          createdAt: new Date(w.created_at)
        }));
        setSavedWorkouts(workouts);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  }, []);

  const saveWorkout = useCallback(async (workout: Workout) => {
    try {
      // Check if already exists in Supabase
      const { data: existing } = await supabase
        .from('workouts')
        .select('id')
        .eq('id', workout.id)
        .maybeSingle();
      
      if (!existing) {
        // Only insert if doesn't exist (avoid duplicates)
        await supabase
          .from('workouts')
          .insert({
            id: workout.id,
            name: workout.name,
            stations: workout.stations,
            created_at: workout.createdAt instanceof Date 
              ? workout.createdAt.toISOString() 
              : workout.createdAt
          });
      }
      
      // Update local state
      setSavedWorkouts(prev => {
        const exists = prev.find(w => w.id === workout.id);
        if (exists) {
          return prev.map(w => w.id === workout.id ? workout : w);
        }
        return [...prev, workout];
      });
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }, []);

  const deleteWorkout = useCallback(async (id: string) => {
    try {
      await supabase
        .from('workouts')
        .delete()
        .eq('id', id);
      
      setSavedWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  }, []);

  const createNewWorkout = useCallback((stations: Station[]) => {
    const workout: Workout = {
      id: Date.now().toString(),
      name: 'New Workout',
      stations,
      createdAt: new Date()
    };
    setCurrentWorkout(workout);
    setCurrentStationIndex(0);
    return workout;
  }, []);

  const loadWorkout = useCallback((workout: Workout) => {
    setCurrentWorkout(workout);
    setCurrentStationIndex(0);
  }, []);

  const updateWorkoutName = useCallback((name: string) => {
    if (currentWorkout) {
      setCurrentWorkout({ ...currentWorkout, name });
    }
  }, [currentWorkout]);

  const goToStation = useCallback((index: number) => {
    if (currentWorkout && index >= 0 && index < currentWorkout.stations.length) {
      setCurrentStationIndex(index);
    }
  }, [currentWorkout]);

  const nextStation = useCallback(() => {
    if (currentWorkout && currentStationIndex < currentWorkout.stations.length - 1) {
      setCurrentStationIndex(prev => prev + 1);
    }
  }, [currentWorkout, currentStationIndex]);

  const prevStation = useCallback(() => {
    if (currentStationIndex > 0) {
      setCurrentStationIndex(prev => prev - 1);
    }
  }, [currentStationIndex]);

  return {
    currentWorkout,
    savedWorkouts,
    currentStationIndex,
    loadSavedWorkouts,
    saveWorkout,
    deleteWorkout,
    createNewWorkout,
    loadWorkout,
    updateWorkoutName,
    goToStation,
    nextStation,
    prevStation,
    setCurrentStationIndex
  };
};
