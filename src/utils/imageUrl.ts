/**
 * Helper function to construct the correct image URL based on environment
 * Handles both local development and production environments
 * 
 * @param imagePath - The image path (e.g., "/uploads/suppliers/image.jpg" or "https://example.com/image.jpg")
 * @returns The full URL to the image
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  // Return empty string if no image path
  if (!imagePath || !imagePath.trim()) {
    return '';
  }

  // If imagePath already starts with http/https, return as is (external URL)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // For production (asllmarket.ir / asllmarket.com)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Iran domains
    if (hostname === 'asllmarket.ir' || hostname === 'www.asllmarket.ir') {
      return `https://asllmarket.ir${imagePath}`;
    }

    // Global domains
    if (hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com') {
      return `https://asllmarket.com${imagePath}`;
    }
  }

  // For local development, use relative path
  // The Vite proxy will handle routing to the backend
  return imagePath;
}

/**
 * Helper function to get image URL for multiple images (comma-separated)
 * Returns the first image URL
 */
export function getFirstImageUrl(imageUrls: string | null | undefined): string {
  if (!imageUrls || !imageUrls.trim()) {
    return '';
  }

  // Split by comma and get first image
  const firstImage = imageUrls.split(',')[0].trim();
  return getImageUrl(firstImage);
}
