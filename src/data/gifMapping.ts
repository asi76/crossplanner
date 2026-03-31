/**
 * GIF URL management — PocketBase storage
 */

import { pb } from '../pbService';

export async function getGifUrl(exerciseId: string): Promise<string | null> {
  try {
    const records = await pb.collection('gif_mappings').getFullList({
      filter: `exercise_id="${exerciseId}"`,
    });
    return records[0]?.gif_url || null;
  } catch (err) {
    console.error('Error loading GIF URL:', err);
    return null;
  }
}

export async function setGifUrl(exerciseId: string, url: string): Promise<void> {
  try {
    // Delete existing
    const existing = await pb.collection('gif_mappings').getFullList({
      filter: `exercise_id="${exerciseId}"`,
    });
    if (existing.length > 0) {
      await pb.collection('gif_mappings').delete(existing[0].id);
    }
    // Insert new
    await pb.collection('gif_mappings').create({
      exercise_id: exerciseId,
      gif_url: url,
    });
  } catch (err) {
    console.error('Error setting GIF URL:', err);
  }
}

export async function getAllGifMappings(): Promise<Record<string, string>> {
  try {
    const records = await pb.collection('gif_mappings').getFullList();
    const mappings: Record<string, string> = {};
    for (const r of records) {
      mappings[(r as any).exercise_id] = (r as any).gif_url;
    }
    return mappings;
  } catch (err) {
    console.error('Error loading GIF mappings:', err);
    return {};
  }
}
