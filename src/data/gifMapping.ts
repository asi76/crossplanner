// GIF storage — Supabase Storage with predictable URLs
// URL format: https://[project].supabase.co/storage/v1/object/public/gifs/[exerciseId].gif

import { supabase } from '../supabase';

const SUPABASE_URL = 'https://kdsstxsthxusgcizzmpr.supabase.co';
const BUCKET = 'gifs';

// Check which GIFs exist in storage
export async function loadGifMappings(): Promise<Record<string, string>> {
  const mapping: Record<string, string> = {};
  
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 100 });
    
    if (error) {
      console.error('Error listing storage:', error);
      return mapping;
    }
    
    if (data) {
      data.forEach(file => {
        if (file.name && file.name.endsWith('.gif')) {
          const exerciseId = file.name.replace('.gif', '');
          mapping[exerciseId] = `${SUPABASE_URL}/storage/v1/object/public/gifs/${file.name}`;
        }
      });
    }
  } catch (err) {
    console.error('Error:', err);
  }
  
  return mapping;
}

// Get GIF URL for an exercise
export function getGifUrl(exerciseId: string): string | null {
  return `${SUPABASE_URL}/storage/v1/object/public/gifs/${exerciseId}.gif`;
}

// Check if GIF exists in localStorage cache
const STORAGE_KEY = 'crosstraining_gifs';

export async function initGifMappings(): Promise<void> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // First time - load from storage
    const mapping = await loadGifMappings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  }
}

export async function setGifUrl(exerciseId: string, url: string): Promise<void> {
  // Update localStorage cache
  const stored = localStorage.getItem(STORAGE_KEY);
  const mapping = stored ? JSON.parse(stored) : {};
  mapping[exerciseId] = url;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
}

export async function removeGifUrl(exerciseId: string): Promise<void> {
  // Update localStorage cache
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const mapping = JSON.parse(stored);
    delete mapping[exerciseId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  }
}

export function getMappedExerciseIds(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return Object.keys(JSON.parse(stored));
  }
  return [];
}
