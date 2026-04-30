// validator.js — Pure, stateless validation functions.
// Returns { valid: boolean, message: string } for each field validator.
// No DOM interaction. Imports constants.js only.
// DBA integrity controls mapped to these functions per DBA-20260425-1.

import {
  CATEGORY_LIMITS,
  CATEGORIES,
  ALLOWED_MIME_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  CATEGORY_LABELS,
} from "./constants.js";

/**
 * Validate expense description.
 * Required, 1–200 characters (trimmed).
 */
export function validateDescription(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed.length === 0) {
    return { valid: false, message: "Description is required." };
  }
  if (trimmed.length > 200) {
    return { valid: false, message: "Description must be 200 characters or fewer." };
  }
  return { valid: true, message: "" };
}

/**
 * Validate expense category.
 * Required, must be one of the five defined category keys.
 */
export function validateCategory(value) {
  if (!value || value === "") {
    return { valid: false, message: "Please select a category." };
  }
  if (!CATEGORIES.includes(value)) {
    return { valid: false, message: "Please select a valid category." };
  }
  return { valid: true, message: "" };
}

/**
 * Validate expense amount.
 * Required, must be a positive number > 0 and <= category limit.
 * @param {string|number} value
 * @param {string} category — must be a valid CATEGORY_LIMITS key
 */
export function validateAmount(value, category) {
  if (value === "" || value === null || value === undefined) {
    return { valid: false, message: "Amount is required." };
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: "Amount must be a positive number." };
  }
  if (num <= 0) {
    return { valid: false, message: "Amount must be greater than $0.00." };
  }
  // Round to 2 decimal places to avoid floating-point drift
  const rounded = Math.round(num * 100) / 100;
  if (category && CATEGORY_LIMITS[category] !== undefined) {
    const limit = CATEGORY_LIMITS[category];
    if (rounded > limit) {
      const label = CATEGORY_LABELS[category] || category;
      const formatted = limit.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return {
        valid: false,
        message: `Amount exceeds the $${formatted} limit for ${label}.`,
      };
    }
  }
  return { valid: true, message: "" };
}

/**
 * Validate expense date.
 * Required, YYYY-MM-DD format, not in the future.
 */
export function validateDate(value) {
  if (!value || value.trim() === "") {
    return { valid: false, message: "Date is required." };
  }
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value.trim())) {
    return { valid: false, message: "Please enter a valid date (YYYY-MM-DD)." };
  }
  const entered = new Date(value.trim() + "T00:00:00");
  if (isNaN(entered.getTime())) {
    return { valid: false, message: "Please enter a valid date." };
  }
  // Compare date only (strip time) to today in local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (entered > today) {
    return { valid: false, message: "Expense date cannot be in the future." };
  }
  return { valid: true, message: "" };
}

/**
 * Validate an attached file.
 * Optional — null/undefined input is valid (no attachment required).
 * If a File is provided: MIME type and extension must be allowed; size must be within limit.
 * @param {File|null|undefined} file
 */
export function validateAttachment(file) {
  if (!file) {
    return { valid: true, message: "" };
  }
  const ext = "." + file.name.split(".").pop().toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type);
  const extOk = ALLOWED_FILE_EXTENSIONS.includes(ext);
  if (!mimeOk || !extOk) {
    return { valid: false, message: "Only PDF, JPG, and PNG files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, message: "File must be 5 MB or smaller." };
  }
  return { valid: true, message: "" };
}

/**
 * Sanitize a file name before storing.
 * Strips all path separators (Unix / and Windows \) to prevent path-traversal
 * data from reaching localStorage. Returns only the basename.
 * @param {File} file
 * @returns {string}
 */
export function sanitizeFileName(file) {
  if (!file || !file.name) return "";
  // Replace any path separator sequences with empty string; keep basename only
  return file.name.replace(/[/\\]/g, "").trim();
}

/**
 * Validate a single line item's data object.
 * @param {{ description, category, amount, date, file }} data
 * @returns {{ valid: boolean, errors: { description?, category?, amount?, date?, attachment? } }}
 */
export function validateLineItem(data) {
  const errors = {};

  const descResult = validateDescription(data.description);
  if (!descResult.valid) errors.description = descResult.message;

  const catResult = validateCategory(data.category);
  if (!catResult.valid) errors.category = catResult.message;

  const amtResult = validateAmount(data.amount, data.category);
  if (!amtResult.valid) errors.amount = amtResult.message;

  const dateResult = validateDate(data.date);
  if (!dateResult.valid) errors.date = dateResult.message;

  const fileResult = validateAttachment(data.file);
  if (!fileResult.valid) errors.attachment = fileResult.message;

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate the entire form (all line items).
 * @param {Array<{ description, category, amount, date, file }>} lineItemsData
 * @returns {{ valid: boolean, itemErrors: Array<{ index: number, errors: object }> }}
 */
export function validateForm(lineItemsData) {
  const itemErrors = [];
  lineItemsData.forEach((item, index) => {
    const result = validateLineItem(item);
    if (!result.valid) {
      itemErrors.push({ index, errors: result.errors });
    }
  });
  return { valid: itemErrors.length === 0, itemErrors };
}
