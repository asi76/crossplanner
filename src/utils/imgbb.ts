// imgbb API - free image hosting
// Upload directly from browser, no server needed

const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY'; // Get free key from imgbb.com

export async function uploadToImgbb(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  if (data.success) {
    return {
      url: data.data.url,
      filename: file.name
    };
  } else {
    throw new Error(data.error?.message || 'Upload failed');
  }
}

export async function deleteFromImgbb(url: string): Promise<void> {
  // imgbb doesn't support deletion via API
  // GIFs will remain but won't be shown once removed from mapping
  console.log('Delete not supported on imgbb free plan');
}
