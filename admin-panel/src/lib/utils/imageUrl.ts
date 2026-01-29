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

  // For production (admin.asllmarket.ir or asllmarket.ir)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'admin.asllmarket.ir' || hostname === 'asllmarket.ir' || hostname === 'www.asllmarket.ir') {
      // In production, images are served directly by Nginx from /uploads/
      // Admin panel and main site share the same domain structure
      return `https://asllmarket.ir${imagePath}`;
    }
  }

  // For local development, use relative path
  return imagePath;
}
