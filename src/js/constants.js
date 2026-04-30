// constants.js — Single source of truth for all hard-coded business rules.
// All other modules import from here; zero magic numbers elsewhere.
// SA-ADR-003: Centralized constants enable future extraction to backend config.

export const CATEGORY_LIMITS = {
  "Travel-Air": 5000,
  "Travel-Car": 1000,
  "Food": 100,
  "Hotel": 500,
  "Mobile": 200,
};

export const CATEGORIES = Object.keys(CATEGORY_LIMITS);

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const MAX_LINE_ITEMS = 10;

export const STORAGE_KEY = "expenseSubmissions";

export const CURRENCY = "USD";

// Human-readable category labels (used in dropdowns and error messages)
export const CATEGORY_LABELS = {
  "Travel-Air": "Travel \u2013 Air",
  "Travel-Car": "Travel \u2013 Car",
  "Food": "Food",
  "Hotel": "Hotel",
  "Mobile": "Mobile",
};
