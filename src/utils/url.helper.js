/**
 * @fileoverview URL helper for building absolute file URLs.
 * File paths stored in the database are relative strings (e.g. "photo.jpg").
 * This helper converts them to full URLs the Flutter app can use directly.
 *
 * @module utils/url.helper
 */

/**
 * Returns the public base URL for file access.
 *
 * In production this is the PHP web application's origin (e.g. https://ltraffic.co.uk/employeesarea).
 * Files are stored in the PHP web directory (UPLOADS_ROOT) and served by Apache — the Node.js
 * server does NOT serve files in production.
 *
 * In development FILES_BASE_URL falls back to the local Node.js server so that uploaded
 * files can still be previewed while running locally.
 *
 * @returns {string} Base URL without trailing slash.
 */
const base = () => (process.env.FILES_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

/**
 * Converts a relative file path stored in the database into a fully qualified URL.
 *
 * Examples:
 *   fullUrl('photo.jpg', 'uploads/hr')        → http://localhost:4000/uploads/hr/photo.jpg
 *   fullUrl('bulletin/doc.pdf')               → http://localhost:4000/bulletin/doc.pdf
 *   fullUrl('https://cdn.example.com/a.jpg')  → https://cdn.example.com/a.jpg  (unchanged)
 *   fullUrl(null)                             → null
 *
 * @param {string|null} filePath - Relative path or filename stored in the database.
 * @param {string} [prefix=''] - Optional folder prefix to prepend (e.g. 'uploads/bulletin').
 * @returns {string|null} Absolute URL, or null if filePath is falsy.
 */
const fullUrl = (filePath, prefix = '') => {
  if (!filePath) return null;
  // Already an absolute URL — return unchanged
  if (/^https?:\/\//.test(filePath)) return filePath;
  const clean = filePath.replace(/^\/+/, '');
  const segment = prefix ? `${prefix}/${clean}` : clean;
  return `${base()}/${segment}`;
};

module.exports = { fullUrl };
