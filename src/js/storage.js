// storage.js — Encapsulates all localStorage access.
// No other module touches localStorage directly.
// DBA operational monitoring guidance (DBA-20260425-1) implemented here.

import { STORAGE_KEY, CURRENCY } from "./constants.js";
import { sanitizeFileName } from "./validator.js";

/**
 * Generate a collision-resistant ID.
 * Format: "<prefix>-<epoch>-<4hex>"
 * Collision probability at sprint volume (≤100 writes/session): negligible.
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix) {
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, "0");
  return `${prefix}-${Date.now()}-${hex}`;
}

/**
 * Load all submissions from localStorage.
 * Returns [] on missing key, SyntaxError, non-Array shape, or private-browsing SecurityError.
 * Never throws.
 * @returns {Array}
 */
export function loadSubmissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Non-array shape — quarantine corrupted data, reset key
      try {
        localStorage.setItem(
          `${STORAGE_KEY}_corrupted_${Date.now()}`,
          raw
        );
      } catch (_) {
        // Quarantine write failed — ignore; proceed with empty array
      }
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return parsed;
  } catch (err) {
    if (err instanceof SyntaxError) {
      // Corrupted JSON — quarantine and reset
      try {
        const corrupted = localStorage.getItem(STORAGE_KEY);
        if (corrupted) {
          localStorage.setItem(
            `${STORAGE_KEY}_corrupted_${Date.now()}`,
            corrupted
          );
        }
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {
        // Best-effort quarantine; swallow
      }
      return [];
    }
    // SecurityError (private browsing) or other — return empty without crashing
    return [];
  }
}

/**
 * Save a new submission to localStorage.
 * Builds the submission envelope, appends to existing array, writes back.
 * Only stores sanitized file names — never file content or raw OS paths.
 *
 * @param {Array<{ description: string, category: string, amount: string|number, date: string, file: File|null }>} lineItemsData
 * @returns {{ success: boolean, id: string|null, error: string|null }}
 */
export function saveSubmission(lineItemsData) {
  try {
    const submissionId = generateId("sub");
    const lineItems = lineItemsData.map((item) => ({
      id: generateId("item"),
      description: String(item.description || "").trim(),
      category: item.category,
      amount: Math.round(parseFloat(item.amount) * 100) / 100,
      date: item.date,
      // Security: store only sanitized filename, never file content or paths
      attachmentFileName: item.file ? sanitizeFileName(item.file) : null,
    }));

    const submission = {
      id: submissionId,
      submittedAt: new Date().toISOString(),
      currency: CURRENCY,
      lineItems,
    };

    const existing = loadSubmissions();
    existing.push(submission);

    const serialized = JSON.stringify(existing);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (writeErr) {
      if (
        writeErr.name === "QuotaExceededError" ||
        writeErr.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        return {
          success: false,
          id: null,
          error:
            "Storage quota exceeded. Please clear old submissions or use a different browser.",
        };
      }
      if (writeErr.name === "SecurityError") {
        return {
          success: false,
          id: null,
          error:
            "Storage is not available in private browsing mode. Your submission cannot be saved.",
        };
      }
      return { success: false, id: null, error: "Failed to save submission." };
    }

    return { success: true, id: submissionId, error: null };
  } catch (err) {
    return {
      success: false,
      id: null,
      error: "An unexpected error occurred while saving. Please try again.",
    };
  }
}
