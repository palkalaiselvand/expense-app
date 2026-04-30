// settings.ts — All user-configurable settings, persisted to localStorage.
// Hard-coded constants in constants/expense.ts serve as fallback defaults.

import type { AppSettings } from '../types/settings'

const SETTINGS_KEY = 'fincorpAppSettings'

/** Default settings that mirror the hard-coded constants — used when nothing is saved yet. */
export const DEFAULT_SETTINGS: AppSettings = {
  categories: [
    { key: 'Travel-Air', label: 'Travel \u2013 Air', limit: 5000, color: '#0ea5e9' },
    { key: 'Travel-Car', label: 'Travel \u2013 Car', limit: 1000, color: '#8b5cf6' },
    { key: 'Food',       label: 'Food',              limit: 100,  color: '#f59e0b' },
    { key: 'Hotel',      label: 'Hotel',             limit: 500,  color: '#10b981' },
    { key: 'Mobile',     label: 'Mobile',            limit: 200,  color: '#ec4899' },
  ],
  submissionWindowDays: 30,
  allowLateSubmissions: true,
  maxItemsPerReport: 10,
  maxAmountPerReport: 10000,
}

/** Load saved settings, falling back to defaults for any missing fields. */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // Ensure categories is a non-empty valid array
      categories:
        Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : DEFAULT_SETTINGS.categories,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Persist settings. Silently handles QuotaExceededError / SecurityError. */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* best-effort */
  }
}
