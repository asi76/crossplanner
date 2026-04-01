import PocketBase from 'pocketbase';

// PocketBase connection
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://pb.asigo.cc/api';

// Create a single PocketBase instance
export const pb = new PocketBase(PB_URL);

// Helper to convert PocketBase record to object with id
const recordToObj = (record: any) => ({ id: record.id, ...record });

// ============ GROUPS (exercise_groups) ============
export const getGroups = async () => {
  const records = await pb.collection('exercise_groups').getFullList({
    sort: 'sort_order',
  });
  return records.map(recordToObj);
};

export const createGroup = async (group: any) => {
  const record = await pb.collection('exercise_groups').create(group);
  return { id: record.id, ...record };
};

export const deleteGroup = async (id: string) => {
  await pb.collection('exercise_groups').delete(id);
};

export const updateGroup = async (id: string, data: any) => {
  const record = await pb.collection('exercise_groups').update(id, data);
  return { id: record.id, ...record };
};

// ============ EXERCISES ============
export const getExercises = async (groupId?: string) => {
  if (groupId) {
    const records = await pb.collection('exercises').getFullList({
      filter: `muscleGroup = '${groupId}'`,
    });
    return records.map(recordToObj);
  }
  const records = await pb.collection('exercises').getFullList();
  return records.map(recordToObj);
};

export const getExercise = async (id: string) => {
  try {
    const record = await pb.collection('exercises').getOne(id);
    return recordToObj(record);
  } catch {
    return null;
  }
};

export const createExercise = async (exercise: any) => {
  const record = await pb.collection('exercises').create(exercise);
  return { id: record.id, ...record };
};

export const updateExercise = async (id: string, data: any) => {
  const record = await pb.collection('exercises').update(id, data);
  return { id: record.id, ...record };
};

export const deleteExercise = async (id: string) => {
  await pb.collection('exercises').delete(id);
};

// ============ WORKOUTS ============
export const getWorkouts = async () => {
  const records = await pb.collection('workouts').getFullList({
    sort: '-createdAt',
  });
  return records.map(recordToObj);
};

export const getWorkout = async (id: string) => {
  try {
    const record = await pb.collection('workouts').getOne(id);
    return recordToObj(record);
  } catch {
    return null;
  }
};

export const createWorkout = async (workout: any) => {
  const record = await pb.collection('workouts').create(workout);
  return { id: record.id, ...record };
};

export const updateWorkout = async (id: string, data: any) => {
  const record = await pb.collection('workouts').update(id, data);
  return { id: record.id, ...record };
};

export const deleteWorkout = async (id: string) => {
  await pb.collection('workouts').delete(id);
};

// Real-time listener for workouts
export const subscribeToWorkouts = (callback: (workouts: any[]) => void) => {
  return pb.collection('workouts').subscribe('*', (e) => {
    if (e.action === 'delete') {
      // Handle deletion
      pb.collection('workouts').getFullList({ sort: '-createdAt' }).then((records) => {
        callback(records.map(recordToObj));
      });
    } else {
      // Refresh all workouts on create/update
      pb.collection('workouts').getFullList({ sort: '-createdAt' }).then((records) => {
        callback(records.map(recordToObj));
      });
    }
  });
};

// ============ GIF MAPPINGS ============
let cachedGifMappings: any[] | null = null;

export const getGifMapping = async (exerciseId: string) => {
  try {
    // Find by exerciseId field
    const records = await pb.collection('gif_mappings').getFullList({
      filter: `exerciseId = '${exerciseId}'`,
    });
    if (records.length > 0) {
      return recordToObj(records[0]);
    }
    return null;
  } catch {
    return null;
  }
};

export const getGifMappings = async () => {
  if (cachedGifMappings) {
    return cachedGifMappings;
  }
  const records = await pb.collection('gif_mappings').getFullList();
  cachedGifMappings = records.map(recordToObj);
  return cachedGifMappings;
};

export const clearGifMappingsCache = () => {
  cachedGifMappings = null;
};

export const setGifMapping = async (exerciseId: string, gifUrl: string) => {
  // Find existing
  const existing = await pb.collection('gif_mappings').getFullList({
    filter: `exerciseId = '${exerciseId}'`,
  });
  
  if (existing.length > 0) {
    await pb.collection('gif_mappings').update(existing[0].id, {
      gifUrl: gifUrl,
    });
  } else {
    await pb.collection('gif_mappings').create({
      exerciseId: exerciseId,
      gifUrl: gifUrl,
    });
  }
  clearGifMappingsCache();
};

export const subscribeToGifMappings = (callback: (mappings: any[]) => void) => {
  return pb.collection('gif_mappings').subscribe('*', () => {
    // Clear cache and refetch
    clearGifMappingsCache();
    getGifMappings().then(callback);
  });
};

// ============ STORAGE (PocketBase file upload) ============
export const uploadGif = async (filename: string, blob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', blob, filename);
  
  // Upload to media collection
  const record = await pb.collection('media').create(formData);
  
  // Return the file URL
  return `${PB_URL}/files/media/${record.id}/${record.file}`;
};

export const getGifUrl = (filename: string) => {
  return `https://storage.googleapis.com/studio-7990555522-7e3ef.firebasestorage.app/gifs/${filename}`;
};

// ============ AUTHENTICATION (Firebase Firebbox - kept separate) ============
// Auth is handled by FirebaseFirebbox, not PocketBase
// These are just stubs to maintain API compatibility
export const authWithPassword = async (email: string, password: string) => {
  // This would use Firebase auth, not PocketBase
  throw new Error('Use Firebase auth for authentication');
};

export const signOut = async () => {
  // This would use Firebase auth, not PocketBase
  throw new Error('Use Firebase auth for sign out');
};
