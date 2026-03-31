/**
 * PocketBase Service Layer for Cross2
 * Sostituisce Firebase/Servizi esistenti
 */

import PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(PB_URL);

// ─── Auth ───────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string) => {
  const auth = await pb.collection('users').authWithPassword(email, password);
  return auth;
};

export const register = async (email: string, password: string) => {
  await pb.collection('users').create({ email, password, passwordConfirm: password });
  return pb.collection('users').authWithPassword(email, password);
};

export const logout = () => pb.authStore.clear();

export const getUser = () => pb.authStore.model;
export const isLoggedIn = () => pb.authStore.isValid;

export const onAuthChange = (callback: (user: RecordModel | null) => void) => {
  return pb.authStore.onChange((token, model) => callback(model));
};

// ─── Exercises ───────────────────────────────────────────────────────────────

export const fetchExercises = async () => {
  return pb.collection('exercises').getFullList({ sort: 'name' });
};

export const createExercise = async (data: {
  name: string;
  description?: string;
  muscles?: string[];
  tipo?: 'aerobico' | 'anaerobico';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  gif_url?: string;
}) => {
  return pb.collection('exercises').create(data);
};

export const updateExercise = async (id: string, data: Partial<{
  name: string;
  description: string;
  muscles: string[];
  tipo: string;
  difficulty: string;
  gif_url: string;
}>) => {
  return pb.collection('exercises').update(id, data);
};

export const deleteExercise = async (id: string) => {
  return pb.collection('exercises').delete(id);
};

// ─── Workouts ────────────────────────────────────────────────────────────────

export const fetchWorkouts = async (userId?: string) => {
  if (userId) {
    return pb.collection('workouts').getFullList({
      filter: `user_id="${userId}"`,
      sort: '-created_at'
    });
  }
  return pb.collection('workouts').getFullList({ sort: '-created_at' });
};

export const createWorkout = async (data: { name: string; user_id: string; created_at?: string }) => {
  return pb.collection('workouts').create(data);
};

export const updateWorkout = async (id: string, data: { name: string }) => {
  return pb.collection('workouts').update(id, data);
};

export const deleteWorkout = async (id: string) => {
  // Delete station → station_exercises cascade
  const stations = await pb.collection('workout_stations').getFullList({
    filter: `workout_id="${id}"`
  });
  await Promise.all(stations.map(async (s: RecordModel) => {
    const exercises = await pb.collection('station_exercises').getFullList({
      filter: `station_id="${s.id}"`
    });
    await Promise.all(exercises.map((e: RecordModel) =>
      pb.collection('station_exercises').delete(e.id)
    ));
    return pb.collection('workout_stations').delete(s.id);
  }));
  return pb.collection('workouts').delete(id);
};

// ─── Workout Stations ─────────────────────────────────────────────────────────

export const fetchStations = async (workoutId: string) => {
  return pb.collection('workout_stations').getFullList({
    filter: `workout_id="${workoutId}"`,
    sort: 'sort_order'
  });
};

export const createStation = async (data: {
  workout_id: string;
  category_id: string;
  sort_order?: number;
}) => {
  return pb.collection('workout_stations').create(data);
};

export const deleteStations = async (workoutId: string) => {
  const stations = await pb.collection('workout_stations').getFullList({
    filter: `workout_id="${workoutId}"`
  });
  await Promise.all(stations.map(async (s: RecordModel) => {
    const exercises = await pb.collection('station_exercises').getFullList({
      filter: `station_id="${s.id}"`
    });
    await Promise.all(exercises.map((e: RecordModel) =>
      pb.collection('station_exercises').delete(e.id)
    ));
    return pb.collection('workout_stations').delete(s.id);
  }));
};

// ─── Station Exercises ────────────────────────────────────────────────────────

export const fetchStationExercises = async (stationId: string) => {
  return pb.collection('station_exercises').getFullList({
    filter: `station_id="${stationId}"`,
    sort: 'sort_order'
  });
};

export const createStationExercise = async (data: {
  station_id: string;
  exercise_id: string;
  exercise_name?: string;
  sort_order?: number;
}) => {
  return pb.collection('station_exercises').create(data);
};

export const deleteStationExercises = async (stationId: string) => {
  const exercises = await pb.collection('station_exercises').getFullList({
    filter: `station_id="${stationId}"`
  });
  await Promise.all(exercises.map((e: RecordModel) =>
    pb.collection('station_exercises').delete(e.id)
  ));
};

// ─── User Profiles ────────────────────────────────────────────────────────────

export const getProfile = async (userId: string) => {
  const records = await pb.collection('user_profiles').getFullList({
    filter: `user_id="${userId}"`
  });
  return records[0] || null;
};

export const upsertProfile = async (userId: string, displayName: string, role = 'enabled') => {
  const existing = await pb.collection('user_profiles').getFullList({
    filter: `user_id="${userId}"`
  });
  if (existing.length > 0) {
    return pb.collection('user_profiles').update(existing[0].id, { display_name: displayName, role });
  }
  return pb.collection('user_profiles').create({ user_id: userId, display_name: displayName, role });
};
