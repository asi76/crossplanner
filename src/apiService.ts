/**
 * Cross2 API Client
 * Sostituisce pocketbase.ts — usa il server Node.js locale
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://83.251.67.34:8090/api';

let authToken: string | null = null;
let authUser: { id: string; email: string; displayName?: string } | null = null;

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers || {}) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authenticate = async (email: string, password: string) => {
    const data = await apiFetch('/auth', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    authToken = data.token;
    authUser = data.user;
    return data;
};

export const signOut = () => {
    authToken = null;
    authUser = null;
};

export const getCurrentUser = () => authUser;
export const isAuthenticated = () => !!authToken;

// ─── Exercises ───────────────────────────────────────────────────────────────

export const fetchExercises = async () => {
    const data = await apiFetch('/collections/exercises/records');
    return data.items || [];
};

export const createExercise = async (exercise: any) => {
    const data = await apiFetch('/collections/exercises/records', {
        method: 'POST',
        body: JSON.stringify(exercise)
    });
    return data;
};

export const updateExercise = async (id: string, data: any) => {
    const result = await apiFetch(`/collections/exercises/records/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    return result;
};

export const deleteExercise = async (id: string) => {
    await apiFetch(`/collections/exercises/records/${id}`, { method: 'DELETE' });
};

// ─── Exercise Groups ─────────────────────────────────────────────────────────

export const fetchExerciseGroups = async () => {
    const data = await apiFetch('/collections/exercise_groups/records');
    return data.items || [];
};

export const createExerciseGroup = async (group: any) => {
    const data = await apiFetch('/collections/exercise_groups/records', {
        method: 'POST',
        body: JSON.stringify(group)
    });
    return data;
};

export const deleteExerciseGroup = async (id: string) => {
    await apiFetch(`/collections/exercise_groups/records/${id}`, { method: 'DELETE' });
};

// ─── GIF Mappings ─────────────────────────────────────────────────────────────

export const getGifUrl = async (exerciseId: string): Promise<string | null> => {
    const data = await apiFetch('/collections/gif_mappings/records');
    const mapping = (data.items || []).find((m: any) => m.exercise_id === exerciseId);
    return mapping?.gif_url || null;
};

export const setGifUrl = async (exerciseId: string, gifUrl: string) => {
    await apiFetch('/collections/gif_mappings/records', {
        method: 'POST',
        body: JSON.stringify({ exercise_id: exerciseId, gif_url: gifUrl })
    });
};

// ─── Workouts ───────────────────────────────────────────────────────────────

export const fetchWorkouts = async () => {
    const data = await apiFetch('/collections/workouts/records');
    return data.items || [];
};

export const createWorkout = async (name: string) => {
    const data = await apiFetch('/collections/workouts/records', {
        method: 'POST',
        body: JSON.stringify({ name })
    });
    return data;
};

export const updateWorkout = async (id: string, name: string) => {
    await apiFetch(`/collections/workouts/records/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
    });
};

export const deleteWorkout = async (id: string) => {
    await apiFetch(`/collections/workouts/records/${id}`, { method: 'DELETE' });
};

// ─── Workout Stations ────────────────────────────────────────────────────────

export const fetchWorkoutStations = async (workoutId: string) => {
    const data = await apiFetch(`/collections/workout_stations/records?filter=workout_id="${workoutId}"`);
    return data.items || [];
};

export const createWorkoutStation = async (station: any) => {
    const data = await apiFetch('/collections/workout_stations/records', {
        method: 'POST',
        body: JSON.stringify(station)
    });
    return data;
};

export const deleteWorkoutStation = async (id: string) => {
    await apiFetch(`/collections/workout_stations/records/${id}`, { method: 'DELETE' });
};

// ─── Station Exercises ───────────────────────────────────────────────────────

export const fetchStationExercises = async (stationId: string) => {
    const data = await apiFetch(`/collections/station_exercises/records?filter=station_id="${stationId}"`);
    return data.items || [];
};

export const createStationExercise = async (exercise: any) => {
    const data = await apiFetch('/collections/station_exercises/records', {
        method: 'POST',
        body: JSON.stringify(exercise)
    });
    return data;
};

export const deleteStationExercise = async (id: string) => {
    await apiFetch(`/collections/station_exercises/records/${id}`, { method: 'DELETE' });
};

// ─── User Profiles ────────────────────────────────────────────────────────────

export const upsertUserProfile = async (displayName: string, role = 'enabled') => {
    await apiFetch('/collections/user_profiles/records', {
        method: 'POST',
        body: JSON.stringify({ display_name: displayName, role })
    });
};
