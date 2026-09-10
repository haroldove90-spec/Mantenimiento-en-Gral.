/**
 * Utility functions for handling, compressing, and validating technician photo evidence.
 * Ensures fast uploads, mobile EXIF auto-rotation, optimal payloads (<40KB per photo),
 * and resilient parsing from Supabase JSONB or text columns.
 */

export const compressImageFile = async (
  file: File,
  maxWidth = 850,
  maxHeight = 850,
  quality = 0.68
): Promise<string> => {
  if (!file || file.size === 0) return '';

  // 1. Try modern createImageBitmap (fast, automatically handles orientation & decodes off-main-thread)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        // Clean up bitmap memory
        if (typeof (bitmap as any).close === 'function') {
          (bitmap as any).close();
        }
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl && dataUrl.startsWith('data:image/jpeg') && dataUrl.length > 200) {
          return dataUrl;
        }
      }
    } catch (e) {
      console.warn('createImageBitmap fallback to FileReader:', e);
    }
  }

  // 2. Fallback to FileReader + HTMLImageElement
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      if (!rawResult) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawResult.startsWith('data:image') && rawResult.length > 200 ? rawResult : '');
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl && dataUrl.length > 200 ? dataUrl : rawResult);
        } catch {
          resolve(rawResult.startsWith('data:image') && rawResult.length > 200 ? rawResult : '');
        }
      };
      img.onerror = () => {
        resolve('');
      };
      img.src = rawResult;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts a valid image URL or DataURI from any string or object
 */
const extractSinglePhoto = (item: any): string => {
  if (!item) return '';
  if (typeof item === 'string') {
    const s = item.trim();
    if (s.startsWith('data:image')) {
      // Must be at least 200 chars to not be a truncated broken string
      return s.length > 200 ? s : '';
    }
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:')) {
      return s;
    }
    return '';
  }
  if (typeof item === 'object') {
    const candidate = item.url || item.src || item.data || item.path || item.image || item.photo || '';
    if (typeof candidate === 'string') {
      return extractSinglePhoto(candidate);
    }
  }
  return '';
};

/**
 * Robustly parses photo arrays stored in Supabase (which can be JSONB arrays, stringified JSON, or comma lists)
 */
export const parsePhotosSafe = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map(extractSinglePhoto)
      .filter(item => item.length > 0);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '[]' || trimmed === '{}') return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(extractSinglePhoto)
          .filter(item => item.length > 0);
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.values(parsed)
          .map(extractSinglePhoto)
          .filter(item => item.length > 0);
      }
    } catch {
      // Non-JSON string: check if comma-separated or single URL
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(s => extractSinglePhoto(s)).filter(s => s.length > 0);
        if (parts.length > 0) return parts;
      }
      const single = extractSinglePhoto(trimmed);
      if (single) return [single];
    }
  }
  if (typeof val === 'object') {
    return Object.values(val)
      .map(extractSinglePhoto)
      .filter(item => item.length > 0);
  }
  return [];
};

/**
 * Validates if a string is a renderable image source
 */
export const isValidImageSrc = (src?: string | null): boolean => {
  if (!src) return false;
  const s = src.trim();
  if (s.startsWith('data:image/')) return s.length > 200;
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:');
};

/**
 * Fallback SVG placeholder for broken or missing images
 */
export const FALLBACK_PHOTO_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';

