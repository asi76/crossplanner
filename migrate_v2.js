/**
 * Firebase → PocketBase Migration Script (v2)
 * 
 * Uso: node migrate_v2.js
 */

const PB_URL = 'https://pb.fitness.asigo.cc/api';
const FIREBASE_PROJECT = 'studio-7990555522-7e3ef';
const FIREBASE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

async function fbGet(collection, params = '') {
  const url = `${FIREBASE_BASE}/${collection}${params ? '?' + params : ''}`;
  console.log(`  [FB] GET ${collection}${params ? '?' + params : ''}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firebase HTTP ${res.status}`);
  const data = await res.json();
  return data.documents || [];
}

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
      if (v.mapValue?.fields) return fbDoc({ fields: v.mapValue.fields });
      return v;
    });
    else if (val.mapValue?.fields) obj[key] = fbDoc({ fields: val.mapValue.fields });
    else if (val.timestampValue) obj[key] = val.timestampValue;
  }
  return obj;
}

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
  console.log('=== Firebase → PocketBase Migration v2 ===\n');

  // 1. Fetch Firebase workouts
  console.log('[1/3] Fetching Firebase workouts...');
  const fbWorkouts = await fbGet('workouts', 'pageSize=100');
  console.log(`  Total: ${fbWorkouts.length} workouts\n`);

  // 2. Fetch PB exercises for ID mapping
  console.log('[2/3] Fetching PocketBase exercises...');
  const pbExercises = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${PB_URL}/collections/exercises/records?perPage=100&page=${page}`);
    const data = await res.json();
    pbExercises.push(...data.items);
    if (page >= data.totalPages) break;
    page++;
  }
  console.log(`  Total: ${pbExercises.length} exercises\n`);

  // Build lookup by name
  const exerciseByName = {};
  pbExercises.forEach(ex => {
    exerciseByName[ex.name.toLowerCase()] = ex;
  });

  // 3. Migrate each workout
  console.log('[3/3] Migrating workouts...\n');
  let migrated = 0;
  let skipped = 0;

  for (const doc of fbWorkouts) {
    const workout = fbDoc(doc);
    const workoutName = workout.name || 'Unknown';
    
    console.log(`Processing: "${workoutName}"`);
    console.log(`  - workout.stations is ${typeof workout.stations}, array: ${Array.isArray(workout.stations)}`);

    if (!workout.stations || !Array.isArray(workout.stations)) {
      console.log(`  SKIP: no stations\n`);
      skipped++;
      continue;
    }

    // Process each station
    const cleanStations = [];
    for (const station of workout.stations) {
      const stationName = station.name || 'Station';
      const stationId = station.id || stationName.toLowerCase().replace(/\s+/g, '-');
      
      console.log(`  Station "${stationName}": ${station.exercises?.length || 0} exercises`);
      
      const cleanExercises = [];
      if (station.exercises && Array.isArray(station.exercises)) {
        for (const ex of station.exercises) {
          const pbEx = exerciseByName[ex.exerciseName?.toLowerCase()];
          cleanExercises.push({
            exerciseId: pbEx?.id || ex.exerciseId || '',
            exerciseName: ex.exerciseName || '',
            groupId: mapMuscleGroup(ex.groupId) || '',
            sets: ex.sets || 3,
            reps: ex.reps || 10,
            time: ex.time || null,
            rest: ex.rest || 60
          });
        }
      }

      cleanStations.push({
        id: stationId,
        name: stationName,
        exercises: cleanExercises
      });
    }

    const totalExercises = cleanStations.reduce((acc, s) => acc + s.exercises.length, 0);
    console.log(`  -> Total exercises after clean: ${totalExercises}`);

    if (totalExercises === 0) {
      console.log(`  SKIP: no exercises\n`);
      skipped++;
      continue;
    }

    const createdAt = workout.createdAt || workout.created_at || new Date().toISOString();
    const pbWorkout = {
      name: workoutName,
      stations: cleanStations,
      createdAt: typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString(),
      savedAt: new Date().toISOString()
    };

    console.log(`  -> POST to PocketBase...`);

    try {
      const res = await fetch(`${PB_URL}/collections/workouts/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pbWorkout)
      });

      if (res.ok) {
        const created = await res.json();
        console.log(`  ✓ SUCCESS: "${workoutName}" (PB ID: ${created.id})\n`);
        migrated++;
      } else {
        const err = await res.json().catch(() => ({ message: 'unknown error' }));
        console.log(`  ✗ ERROR: ${err.message}\n`);
      }
    } catch (e) {
      console.log(`  ✗ EXCEPTION: ${e.message}\n`);
    }
  }

  console.log('=== Migration Complete ===');
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
