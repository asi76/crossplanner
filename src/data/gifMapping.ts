// GIF mapping — stored on GitHub raw content
const GITHUB_RAW = 'https://raw.githubusercontent.com/asi76/crosstraining/main/public/gifs';

export const gifMapping: Record<string, string> = {

// Cardio/HIIT
  "card1": `${GITHUB_RAW}/card1.gif`,
  "card2": `${GITHUB_RAW}/card2.gif`,
  "card3": `${GITHUB_RAW}/card3.gif`,
  "card4": `${GITHUB_RAW}/card4.gif`,
  "card5": `${GITHUB_RAW}/card5.gif`,
  "card6": `${GITHUB_RAW}/card6.gif`,
  "card7": `${GITHUB_RAW}/card7.gif`,
  "card8": `${GITHUB_RAW}/card8.gif`,
  "card9": `${GITHUB_RAW}/card9.gif`,
  "card10": `${GITHUB_RAW}/card10.gif`,
  "card11": `${GITHUB_RAW}/card11.gif`,

// Core
  "core1": `${GITHUB_RAW}/core1.gif`,
  "core2": `${GITHUB_RAW}/core2.gif`,
  "core3": `${GITHUB_RAW}/core3.gif`,
  "core4": `${GITHUB_RAW}/core4.gif`,
  "core5": `${GITHUB_RAW}/core5.gif`,
  "core6": `${GITHUB_RAW}/core6.gif`,
  "core7": `${GITHUB_RAW}/core7.gif`,
  "core8": `${GITHUB_RAW}/core8.gif`,
  "core9": `${GITHUB_RAW}/core9.gif`,
  "core10": `${GITHUB_RAW}/core10.gif`,
  "core11": `${GITHUB_RAW}/core11.gif`,

// Lower Body
  "lb1": `${GITHUB_RAW}/lb1.gif`,
  "lb2": `${GITHUB_RAW}/lb2.gif`,
  "lb3": `${GITHUB_RAW}/lb3.gif`,
  "lb4": `${GITHUB_RAW}/lb4.gif`,
  "lb5": `${GITHUB_RAW}/lb5.gif`,
  "lb6": `${GITHUB_RAW}/lb6.gif`,
  "lb7": `${GITHUB_RAW}/lb7.gif`,
  "lb8": `${GITHUB_RAW}/lb8.gif`,
  "lb9": `${GITHUB_RAW}/lb9.gif`,
  "lb10": `${GITHUB_RAW}/lb10.gif`,
  "lb11": `${GITHUB_RAW}/lb11.gif`,

// Plyometric
  "ply1": `${GITHUB_RAW}/ply1.gif`,
  "ply2": `${GITHUB_RAW}/ply2.gif`,
  "ply3": `${GITHUB_RAW}/ply3.gif`,
  "ply4": `${GITHUB_RAW}/ply4.gif`,
  "ply5": `${GITHUB_RAW}/ply5.gif`,
  "ply6": `${GITHUB_RAW}/ply6.gif`,
  "ply7": `${GITHUB_RAW}/ply7.gif`,
  "ply8": `${GITHUB_RAW}/ply8.gif`,
  "ply9": `${GITHUB_RAW}/ply9.gif`,
  "ply10": `${GITHUB_RAW}/ply10.gif`,
  "ply11": `${GITHUB_RAW}/ply11.gif`,

// Upper Push
  "up1": `${GITHUB_RAW}/up1.gif`,
  "up2": `${GITHUB_RAW}/up2.gif`,
  "up3": `${GITHUB_RAW}/up3.gif`,
  "up4": `${GITHUB_RAW}/up4.gif`,
  "up5": `${GITHUB_RAW}/up5.gif`,
  "up6": `${GITHUB_RAW}/up6.gif`,
  "up7": `${GITHUB_RAW}/up7.gif`,
  "up8": `${GITHUB_RAW}/up8.gif`,
  "up9": `${GITHUB_RAW}/up9.gif`,
  "up10": `${GITHUB_RAW}/up10.gif`,
  "up11": `${GITHUB_RAW}/up11.gif`,

// Upper Pull
  "upl1": `${GITHUB_RAW}/upl1.gif`,
  "upl2": `${GITHUB_RAW}/upl2.gif`,
  "upl3": `${GITHUB_RAW}/upl3.gif`,
  "upl4": `${GITHUB_RAW}/upl4.gif`,
  "upl5": `${GITHUB_RAW}/upl5.gif`,
  "upl6": `${GITHUB_RAW}/upl6.gif`,
  "upl7": `${GITHUB_RAW}/upl7.gif`,
  "upl8": `${GITHUB_RAW}/upl8.gif`,
  "upl9": `${GITHUB_RAW}/upl9.gif`,
  "upl10": `${GITHUB_RAW}/upl10.gif`,
  "upl11": `${GITHUB_RAW}/upl11.gif`,
};

export function getGifUrl(exerciseId: string): string | null {
  return gifMapping[exerciseId] ?? null;
}

export function getMappedExerciseIds(): string[] {
  return Object.keys(gifMapping);
}
