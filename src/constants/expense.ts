import type { CategoryKey } from '../types/expense'

// ── Per-category spending limits (USD, per line item) ─────────────────────────
export const CATEGORY_LIMITS: Record<CategoryKey, number> = {
  'Travel-Air': 5000,
  'Travel-Car': 1000,
  Food: 100,
  Hotel: 500,
  Mobile: 200,
}

// ── Human-readable category labels ────────────────────────────────────────────
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  'Travel-Air': 'Travel \u2013 Air',
  'Travel-Car': 'Travel \u2013 Car',
  Food: 'Food',
  Hotel: 'Hotel',
  Mobile: 'Mobile',
}

// ── Category accent colors (for badges/chips) ─────────────────────────────────
export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  'Travel-Air': '#0ea5e9', // sky-500
  'Travel-Car': '#8b5cf6', // violet-500
  Food: '#f59e0b',         // amber-500
  Hotel: '#10b981',        // emerald-500
  Mobile: '#ec4899',       // pink-500
}

// ── Attachment constraints ─────────────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB per line-item receipt

// ── Global receipt upload ──────────────────────────────────────────────────────
export const GLOBAL_ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.zip']
export const GLOBAL_MAX_TOTAL_BYTES = 25 * 1024 * 1024  // 25 MB total

// ── Form limits ────────────────────────────────────────────────────────────────
export const MAX_LINE_ITEMS = 10

// ── Storage ────────────────────────────────────────────────────────────────────
export const STORAGE_KEY = 'expenseSubmissions'

export const CURRENCY = 'USD'
