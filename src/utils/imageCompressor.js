function fitWithin(width, height, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function renderJpeg(image, maxWidth, maxHeight, quality) {
  const dimensions = fitWithin(image.width, image.height, maxWidth, maxHeight);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
  return canvas.toDataURL('image/jpeg', quality);
}

function loadImageFile(file) {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Create a normal image for the lightbox and a tiny preview for committee cards.
 * Card previews are intentionally small so they can travel with live summaries.
 */
export async function compressImageVersions(file) {
  const image = await loadImageFile(file);
  if (!image) return null;

  return {
    url: renderJpeg(image, 800, 800, 0.65),
    thumbnailUrl: renderJpeg(image, 180, 120, 0.48)
  };
}

// Kept for callers that only need the full-size compressed image.
export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.65) {
  const image = await loadImageFile(file);
  return image ? renderJpeg(image, maxWidth, maxHeight, quality) : null;
}
