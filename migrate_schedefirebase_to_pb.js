/**
 * Firebase → PocketBase Migration Script
 * 
 * Migra le schede (workouts) da Firebase Firestore a PocketBase Cross2
 * 
 * Uso: node migrate_schedefirebase_to_pb.js
 */

import PocketBase from 'pocketbase';

const PB_URL = 'https://pb.fitness.asigo.cc/api';
const pb = new PocketBase(PB_URL);

// Firebase config (pubblica, letta via REST)
const FIREBASE_PROJECT = 'studio-7990555522-7e3ef';
const FIREBASE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

// Helper: fetch Firebase REST API
async function fbGet(collection, params = '') {
  const url = `${FIREBASE_BASE}/${collection}${params ? '?' + params : ''}`;
  console.log(`  [Firebase] GET ${collection}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firebase HTTP ${res.status}`);
  const data = await res.json();
  return data.documents || [];
}

// Convert Firebase doc to object
function fbDoc(doc) {
  const fields = doc.fields;
  const obj = {};
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) obj[key] = val.stringValue;
    else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue, 10);
    else if (val.doubleValue !== undefined) obj[key] = parseFloat(val.doubleValue);
    else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
    else if (val.arrayValue?.values) obj[key] = val.arrayValue.values.map(v => {
      if (v.stringValue !== undefined) return v.stringValue;
      if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
      return v;
    });
    else if (val.mapValue?.fields) obj[key] = fbDoc({ fields: val.mapValue.fields });
    else if (val.timestampValue) obj[key] = val.timestampValue;
  }
  return obj;
}

// Map Firebase group names to Cross2 muscleGroup values
function mapMuscleGroup(fbGroupId) {
  const map = {
    'cardio-hiit': 'cardio',
    'chest': 'chest',
    'back': 'back',
    'legs': 'legs',
    'core': 'core',
    'biceps-triceps': 'arms',
    'shoulders': 'shoulders',
    'non-assegnati': 'core'
  };
  return map[fbGroupId] || fbGroupId;
}

async function main() {
  console.log('=== Firebase → PocketBase Migration ===\n');

  // 1. Fetch all Firebase data
  console.log('[1/4] Fetching Firebase data...');
  
  const fbWorkouts = await fbGet('workouts', 'pageSize=100');
  console.log(`  Found ${fbWorkouts.length} workouts in Firebase`);

  const fbGroups = await fbGet('exercise_groups', 'pageSize=20');
  console.log(`  Found ${fbGroups.length} exercise groups in Firebase`);

  // 2. Map Firebase groups to PB muscleGroups
  console.log('\n[2/4] Mapping exercise groups...');
  const groupMapping = {}; // fb_group_id -> pb muscleGroup
  fbGroups.forEach(doc => {
    const group = fbDoc(doc);
    const fbId = group.id || doc.name.split('/').pop();
    const pbMuscleGroup = mapMuscleGroup(fbId);
    groupMapping[fbId] = pbMuscleGroup;
    console.log(`  ${fbId} -> ${pbMuscleGroup}`);
  });

  // 3. Get existing PB exercises to map IDs
  console.log('\n[3/4] Fetching existing PocketBase exercises...');
  const pbExercises = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${PB_URL}/collections/exercises/records?perPage=100&page=${page}`);
    const data = await res.json();
    pbExercises.push(...data.items);
    if (page >= data.totalPages) break;
    page++;
  }
  console.log(`  Found ${pbExercises.length} exercises in PocketBase`);

  // Build exercise lookup by name
  const exerciseByName = {};
  pbExercises.forEach(ex => {
    exerciseByName[ex.name.toLowerCase()] = ex;
  });

  // 4. Migrate workouts
  console.log('\n[4/4] Migrating workouts...');
  let migrated = 0;
  let skipped = 0;

  for (const doc of fbWorkouts) {
    const workout = fbDoc(doc);
    const workoutId = workout.id || doc.name.split('/').pop();
    const createdAt = workout.createdAt || workout.created_at || new Date().toISOString();

    // Clean stations data
    const stations = (workout.stations || []).map(station => ({
      id: station.id || station.name?.toLowerCase().replace(/\s+/g, '-'),
      name: station.name || 'Station',
      exercises: (station.exercises || []).map(ex => {
        // Try to find matching exercise in PB by name
        const pbEx = exerciseByName[ex.exerciseName?.toLowerCase()];
        return {
          exerciseId: pbEx?.id || ex.exerciseId || '',
          exerciseName: ex.exerciseName || '',
          groupId: ex.groupId || mapMuscleGroup(ex.groupId) || '',
          sets: ex.sets || 3,
          reps: ex.reps || 10,
          time: ex.time || null,
          rest: ex.rest || 60
        };
      })
    }));

    const hasExercises = stations.some(s => (s.exercises || []).length > 0);
    console.log(`  Checking workout: "${workout.name}" - ${stations.length} stations, total exercises: ${stations.reduce((a,s) => a + (s.exercises||[]).length, 0)}, hasExercises=${hasExercises}`);
    if (!hasExercises) {
      console.log(`  Skipping empty workout: ${workout.name || workoutId}`);
      skipped++;
      continue;
    }

    const pbWorkout = {
      name: workout.name || `Scheda ${workoutId}`,
      stations: stations,
      createdAt: typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString(),
      savedAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${PB_URL}/collections/workouts/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pbWorkout)
      });
      
      if (res.ok) {
        const created = await res.json();
        console.log(`  ✓ Migrated: "${pbWorkout.name}" (PB ID: ${created.id})`);
        migrated++;
      } else {
        const err = await res.json();
        console.log(`  ✗ Error migrating "${workout.name}": ${err.message}`);
      }
    } catch (e) {
      console.log(`  ✗ Exception: ${e.message}`);
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
