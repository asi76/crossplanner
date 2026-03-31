/**
 * PocketBase client for Cross2
 * Connette al database PocketBase locale in sostituzione di Firebase.
 */

import PocketBase from 'pocketbase';

const PB_URL = 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);

// Tipo per utente autenticato
export interface PBUser {
  id: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'enabled' | 'pending' | 'user';
}

// Tipo per esercizio
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscles?: string[];
  tipo?: 'aerobico' | 'anaerobico';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  gif_url?: string;
  created?: string;
  updated?: string;
}

// Tipo per workout
export interface Workout {
  id: string;
  name: string;
  user_id: string;
  created_at?: string;
  updated?: string;
}

// Tipo per station (categoria workout: forza, cardio1, cardio2)
export interface WorkoutStation {
  id: string;
  workout_id: string;
  category_id: 'forza' | 'cardio1' | 'cardio2';
  sort_order?: number;
  created?: string;
  updated?: string;
}

// Tipo per esercizio dentro una station
export interface StationExercise {
  id: string;
  station_id: string;
  exercise_id: string;
  exercise_name?: string;
  sort_order?: number;
  created?: string;
  updated?: string;
}

// === AUTH HELPERS ===

export const authenticateUser = async (email: string, password: string) => {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData;
  } catch (e) {
    // Try to create account if doesn't exist
    try {
      await pb.collection('users').create({ email, password, passwordConfirm: password });
      const authData = await pb.collection('users').authWithPassword(email, password);
      return authData;
    } catch (e2) {
      throw e;
    }
  }
};

export const signOut = () => pb.authStore.clear();

export const onAuthChange = (callback: (user: PBUser | null) => void) => {
  pb.authStore.onChange((token, model) => {
    callback(model as PBUser | null);
  });
};

export const getCurrentUser = (): PBUser | null => {
  return pb.authStore.model as PBUser;
};

export const isAuthenticated = () => pb.authStore.isValid;

// === DATA HELPERS ===

export const getExercises = async (): Promise<Exercise[]> => {
  const records = await pb.collection('exercises').getFullList({ sort: 'name' });
  return records as unknown as Exercise[];
};

export const createExercise = async (data: Partial<Exercise>): Promise<Exercise> => {
  const record = await pb.collection('exercises').create(data);
  return record as unknown as Exercise;
};

export const updateExercise = async (id: string, data: Partial<Exercise>): Promise<Exercise> => {
  const record = await pb.collection('exercises').update(id, data);
  return record as unknown as Exercise;
};

export const deleteExercise = async (id: string) => {
  await pb.collection('exercises').delete(id);
};

export const getWorkouts = async (userId?: string): Promise<Workout[]> => {
  const opts: any = { sort: '-created_at' };
  if (userId) opts.filter = `user_id="${userId}"`;
  const records = await pb.collection('workouts').getFullList(opts);
  return records as unknown as Workout[];
};

export const createWorkout = async (data: Partial<Workout>): Promise<Workout> => {
  const record = await pb.collection('workouts').create(data);
  return record as unknown as Workout;
};

export const updateWorkout = async (id: string, data: Partial<Workout>): Promise<Workout> => {
  const record = await pb.collection('workouts').update(id, data);
  return record as unknown as Workout;
};

export const deleteWorkout = async (id: string) => {
  // Delete all station exercises first
  const stations = await pb.collection('workout_stations').getFullList({
    filter: `workout_id="${id}"`
  });
  for (const station of stations) {
    await pb.collection('station_exercises').getFullList({
      filter: `station_id="${station.id}"`
    }).then(se => Promise.all(se.map((s: any) => pb.collection('station_exercises').delete(s.id))));
    await pb.collection('workout_stations').delete(station.id);
  }
  await pb.collection('workouts').delete(id);
};

export const getWorkoutStations = async (workoutId: string): Promise<WorkoutStation[]> => {
  const records = await pb.collection('workout_stations').getFullList({
    filter: `workout_id="${workoutId}"`,
    sort: 'sort_order'
  });
  return records as unknown as WorkoutStation[];
};

export const createWorkoutStation = async (data: Partial<WorkoutStation>): Promise<WorkoutStation> => {
  const record = await pb.collection('workout_stations').create(data);
  return record as unknown as WorkoutStation;
};

export const deleteWorkoutStations = async (workoutId: string) => {
  const stations = await pb.collection('workout_stations').getFullList({
    filter: `workout_id="${workoutId}"`
  });
  for (const station of stations) {
    await pb.collection('station_exercises').getFullList({
      filter: `station_id="${station.id}"`
    }).then(se => Promise.all(se.map((s: any) => pb.collection('station_exercises').delete(s.id))));
    await pb.collection('workout_stations').delete(station.id);
  }
};

export const getStationExercises = async (stationId: string): Promise<StationExercise[]> => {
  const records = await pb.collection('station_exercises').getFullList({
    filter: `station_id="${stationId}"`,
    sort: 'sort_order'
  });
  return records as unknown as StationExercise[];
};

export const createStationExercise = async (data: Partial<StationExercise>): Promise<StationExercise> => {
  const record = await pb.collection('station_exercises').create(data);
  return record as unknown as StationExercise;
};

export const deleteAllStationExercises = async (stationId: string) => {
  const records = await pb.collection('station_exercises').getFullList({
    filter: `station_id="${stationId}"`
  });
  await Promise.all(records.map((r: any) => pb.collection('station_exercises').delete(r.id)));
};

// === USER PROFILE HELPERS ===

export const getUserProfile = async (userId: string) => {
  try {
    const records = await pb.collection('user_profiles').getFullList({
      filter: `user_id="${userId}"`
    });
    return records[0] || null;
  } catch {
    return null;
  }
};

export const createUserProfile = async (userId: string, displayName: string, role = 'enabled') => {
  try {
    const existing = await getUserProfile(userId);
    if (existing) return existing;
    const record = await pb.collection('user_profiles').create({
      user_id: userId,
      display_name: displayName,
      role
    });
    return record;
  } catch (e) {
    console.error('createUserProfile error:', e);
    return null;
  }
};
