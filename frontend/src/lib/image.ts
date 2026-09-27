/**
 * Resolves product and media image URLs for development and production.
 *
 * Handles:
 * - External absolute URLs (e.g. Unsplash, CDN): returns as-is
 * - Local server uploads (e.g. /uploads/img-...): prepends backend origin
 * - Missing/empty values: falls back to default placeholder
 */

export function getImageUrl(imagePath?: string | null, fallback: string = '/placeholder.jpg'): string {
  if (!imagePath || typeof imagePath !== 'string' || !imagePath.trim()) {
    return fallback;
  }

  const trimmed = imagePath.trim();

  // Already an absolute URL or data URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Local server uploads (/uploads/...)
  if (trimmed.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    // Remove trailing /api or /api/ to get backend origin
    const backendOrigin = apiBase.replace(/\/api\/?$/, '');
    return `${backendOrigin}${trimmed}`;
  }

  return trimmed;
}
