export async function cropImageFromBbox(imageBlob, bbox) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        const [x, y, width, height] = bbox;
        
        // Convert percentage coordinates to pixel coordinates
        const pixelX = (x / 100) * img.width;
        const pixelY = (y / 100) * img.height;
        const pixelWidth = (width / 100) * img.width;
        const pixelHeight = (height / 100) * img.height;
        
        // Ensure bounds are within image dimensions
        const clampedX = Math.max(0, Math.min(pixelX, img.width - 1));
        const clampedY = Math.max(0, Math.min(pixelY, img.height - 1));
        const clampedWidth = Math.max(1, Math.min(pixelWidth, img.width - clampedX));
        const clampedHeight = Math.max(1, Math.min(pixelHeight, img.height - clampedY));
        
        // Set canvas dimensions to cropped size
        canvas.width = clampedWidth;
        canvas.height = clampedHeight;
        
        // Draw the cropped portion
        ctx.drawImage(
          img,
          clampedX, clampedY, clampedWidth, clampedHeight, // Source rectangle
          0, 0, clampedWidth, clampedHeight // Destination rectangle
        );
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Convert to data URL for immediate use
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Failed to create cropped image blob'));
          }
        }, 'image/jpeg', 0.9);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Convert blob to data URL for img src
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
}

export async function cropMultipleItems(imageBlob, items) {
  const croppedItems = [];
  
  for (const item of items) {
    try {
      const croppedImage = await cropImageFromBbox(imageBlob, item.bbox);
      croppedItems.push({
        ...item,
        croppedImage // Data URL of cropped image
      });
    } catch (error) {
      console.error('Failed to crop item:', item.object, error);
      // Fallback to original image if cropping fails
      croppedItems.push({
        ...item,
        croppedImage: null
      });
    }
  }
  
  return croppedItems;
}