// GIF mapping for exercises
// Stored in Firebase Storage: gs://studio-7990555522-7e3ef.firebasestorage.app/gifs/

const BUCKET = 'studio-7990555522-7e3ef.firebasestorage.app';

/**
 * Get the Firebase Storage URL for an exercise GIF.
 * Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/gifs/{id}.gif?alt=media
 */
function getFirebaseGifUrl(exerciseId: string): string {
  const encodedPath = encodeURIComponent(`gifs/${exerciseId}.gif`);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodedPath}?alt=media`;
}

export const gifMapping: Record<string, string> = {
  // Cardio/HIIT
  "card1": getFirebaseGifUrl("card1"),
  "card2": getFirebaseGifUrl("card2"),
  "card3": getFirebaseGifUrl("card3"),
  "card4": getFirebaseGifUrl("card4"),
  "card5": getFirebaseGifUrl("card5"),
  "card6": getFirebaseGifUrl("card6"),
  "card7": getFirebaseGifUrl("card7"),
  "card8": getFirebaseGifUrl("card8"),
  "card9": getFirebaseGifUrl("card9"),
  "card10": getFirebaseGifUrl("card10"),
  "card11": getFirebaseGifUrl("card11"),

  // Core
  "core1": getFirebaseGifUrl("core1"),
  "core2": getFirebaseGifUrl("core2"),
  "core3": getFirebaseGifUrl("core3"),
  "core4": getFirebaseGifUrl("core4"),
  "core5": getFirebaseGifUrl("core5"),
  "core6": getFirebaseGifUrl("core6"),
  "core7": getFirebaseGifUrl("core7"),
  "core8": getFirebaseGifUrl("core8"),
  "core9": getFirebaseGifUrl("core9"),
  "core10": getFirebaseGifUrl("core10"),
  "core11": getFirebaseGifUrl("core11"),

  // Lower Body
  "lb1": getFirebaseGifUrl("lb1"),
  "lb2": getFirebaseGifUrl("lb2"),
  "lb3": getFirebaseGifUrl("lb3"),
  "lb4": getFirebaseGifUrl("lb4"),
  "lb5": getFirebaseGifUrl("lb5"),
  "lb6": getFirebaseGifUrl("lb6"),
  "lb7": getFirebaseGifUrl("lb7"),
  "lb8": getFirebaseGifUrl("lb8"),
  "lb9": getFirebaseGifUrl("lb9"),
  "lb10": getFirebaseGifUrl("lb10"),
  "lb11": getFirebaseGifUrl("lb11"),

  // Plyometric
  "ply1": getFirebaseGifUrl("ply1"),
  "ply2": getFirebaseGifUrl("ply2"),
  "ply3": getFirebaseGifUrl("ply3"),
  "ply4": getFirebaseGifUrl("ply4"),
  "ply5": getFirebaseGifUrl("ply5"),
  "ply6": getFirebaseGifUrl("ply6"),
  "ply7": getFirebaseGifUrl("ply7"),
  "ply8": getFirebaseGifUrl("ply8"),
  "ply9": getFirebaseGifUrl("ply9"),
  "ply10": getFirebaseGifUrl("ply10"),
  "ply11": getFirebaseGifUrl("ply11"),

  // Upper Push
  "up1": getFirebaseGifUrl("up1"),
  "up2": getFirebaseGifUrl("up2"),
  "up3": getFirebaseGifUrl("up3"),
  "up4": getFirebaseGifUrl("up4"),
  "up5": getFirebaseGifUrl("up5"),
  "up6": getFirebaseGifUrl("up6"),
  "up7": getFirebaseGifUrl("up7"),
  "up8": getFirebaseGifUrl("up8"),
  "up9": getFirebaseGifUrl("up9"),
  "up10": getFirebaseGifUrl("up10"),
  "up11": getFirebaseGifUrl("up11"),

  // Upper Pull
  "upl1": getFirebaseGifUrl("upl1"),
  "upl2": getFirebaseGifUrl("upl2"),
  "upl3": getFirebaseGifUrl("upl3"),
  "upl4": getFirebaseGifUrl("upl4"),
  "upl5": getFirebaseGifUrl("upl5"),
  "upl6": getFirebaseGifUrl("upl6"),
  "upl7": getFirebaseGifUrl("upl7"),
  "upl8": getFirebaseGifUrl("upl8"),
  "upl9": getFirebaseGifUrl("upl9"),
  "upl10": getFirebaseGifUrl("upl10"),
  "upl11": getFirebaseGifUrl("upl11"),
};

/**
 * Get GIF URL for an exercise ID.
 * Returns null if no GIF is mapped.
 */
export function getGifUrl(exerciseId: string): string | null {
  return gifMapping[exerciseId] ?? null;
}

/**
 * Get all exercise IDs that have GIFs mapped.
 */
export function getMappedExerciseIds(): string[] {
  return Object.keys(gifMapping);
}
