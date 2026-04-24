/**
 * @fileoverview Business logic for the Document Control module (admin side).
 * Manages two document types:
 *
 * 1. COSHH — Control of Substances Hazardous to Health sheets.
 *    PDFs are served from httpdocs/employeesarea/downloads/coshh/<cos1>.pdf.
 *    cos1 stores the reference code; the .pdf extension is appended when building the URL.
 *
 * 2. Equipment Documents — files attached to equipment register (er) entries.
 *    PHP ajaxupload4.php saves to erfiles/ (relative to admin/ folder).
 *    DB stores the path without the 'admin/' prefix: erfiles/filename.pdf
 *    Full URL: FILES_BASE_URL/admin/erfiles/filename.pdf
 *
 * @module services/document.service
 */

const DocumentModel = require('../models/document.model');
const { fullUrl } = require('../utils/url.helper');

// ─── COSHH ───────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of COSHH documents, each with a file_url
 * pointing to the PDF built from the cos1 reference field.
 *
 * @param {object} query - Filters: search, searchLink, page, limit.
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
const coshhGetAll = async (query) => {
  const result = await DocumentModel.coshhFindAll(query);
  result.data = result.data.map(c => ({
    ...c,
    // COSHH PDFs are stored as /downloads/coshh/<cos1>.pdf on the web server
    file_url: c.cos1 ? fullUrl(`downloads/coshh/${c.cos1}.pdf`) : null,
  }));
  return result;
};

/**
 * Returns a single COSHH document by ID with file_url.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const coshhGetById = async (id) => {
  const doc = await DocumentModel.coshhFindById(id);
  if (!doc) return null;
  return { ...doc, file_url: doc.cos1 ? fullUrl(`downloads/coshh/${doc.cos1}.pdf`) : null };
};

/**
 * Creates a new COSHH document entry and returns it with file_url.
 *
 * @param {object} fields - cos1, cos2, cos3.
 * @returns {Promise<object>}
 */
const coshhCreate = async (fields) => {
  const id = await DocumentModel.coshhCreate(fields);
  return coshhGetById(id);
};

/**
 * Updates a COSHH document entry and returns the refreshed record.
 *
 * @param {number} id
 * @param {object} fields - Partial update payload.
 * @returns {Promise<object>}
 */
const coshhUpdate = async (id, fields) => {
  await DocumentModel.coshhUpdate(id, fields);
  return coshhGetById(id);
};

/**
 * Permanently deletes a COSHH document entry.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const coshhRemove = async (id) => DocumentModel.coshhRemove(id);

// ─── Equipment Documents ──────────────────────────────────────────────────────

/**
 * Returns all documents attached to a specific equipment record,
 * each with a file_url pointing to the uploaded file.
 *
 * @param {number} equipmentId - ID of the parent equipment record.
 * @returns {Promise<object[]>}
 */
const erDocGetAll = async (equipmentId) => {
  const docs = await DocumentModel.erDocFindAll(equipmentId);
  return docs.map(d => ({
    ...d,
    // DB stores erfiles/filename.pdf (relative to admin folder), so prefix with 'admin'
    file_url: d.docfile ? fullUrl(d.docfile, 'admin') : null,
  }));
};

/**
 * Attaches a new document to an equipment record.
 * The uploaded filename must be set as fields.docfile before calling.
 *
 * @param {object} fields - erid, docname, docfile.
 * @returns {Promise<object|null>} The newly created document row, or null.
 */
const erDocCreate = async (fields) => {
  const id = await DocumentModel.erDocCreate(fields);
  // Re-fetch all documents for this equipment item and return the new one
  const docs = await DocumentModel.erDocFindAll(fields.erid);
  return docs.find(d => d.id === id) || null;
};

/**
 * Permanently deletes an equipment document record.
 *
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const erDocRemove = async (id) => DocumentModel.erDocRemove(id);

module.exports = {
  coshhGetAll, coshhGetById, coshhCreate, coshhUpdate, coshhRemove,
  erDocGetAll, erDocCreate, erDocRemove,
};
