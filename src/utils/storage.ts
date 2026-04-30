// storage.ts — All localStorage access is encapsulated here.
// No other module may read or write localStorage directly.
// Security: only sanitized file names are stored, never file content or raw paths.

import { STORAGE_KEY, CURRENCY } from '../constants/expense'
import type { LineItem, Submission } from '../types/expense'
import { sanitizeFileName } from './validator'

function generateId(prefix: string): string {
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0')
  return `${prefix}-${Date.now()}-${hex}`
}

/** Load all submissions. Returns [] on missing key, corrupt data, or SecurityError. */
export function loadSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      // Quarantine corrupted data then reset
      try {
        localStorage.setItem(`${STORAGE_KEY}_corrupted_${Date.now()}`, raw)
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* best-effort */
      }
      return []
    }
    return parsed as Submission[]
  } catch (err) {
    if (err instanceof SyntaxError) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw)
          localStorage.setItem(`${STORAGE_KEY}_corrupted_${Date.now()}`, raw)
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* best-effort */
      }
    }
    return []
  }
}

export function saveSubmission(
  lineItems: LineItem[],
  billableToClient: boolean,
): { success: boolean; id: string | null; error: string | null } {
  try {
    const submissionId = generateId('sub')

    const storedLineItems = lineItems.map((item) => ({
      id: generateId('item'),
      date: item.date,
      category: item.category as Submission['lineItems'][0]['category'],
      merchant: item.merchant.trim(),
      description: item.description.trim(),
      // Store numeric value, rounded to 2dp
      amount: Math.round(parseFloat(item.amount) * 100) / 100,
      // Security: never store file content; only sanitized basename
      attachmentFileName: item.attachmentFile
        ? sanitizeFileName(item.attachmentFile)
        : null,
    }))

    const submission: Submission = {
      id: submissionId,
      submittedAt: new Date().toISOString(),
      currency: CURRENCY,
      billableToClient,
      lineItems: storedLineItems,
    }

    const existing = loadSubmissions()
    existing.push(submission)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (writeErr: unknown) {
      const e = writeErr as { name?: string }
      if (e?.name === 'QuotaExceededError' || e?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        return {
          success: false,
          id: null,
          error: 'Storage quota exceeded. Please clear old submissions.',
        }
      }
      if (e?.name === 'SecurityError') {
        return {
          success: false,
          id: null,
          error: 'Storage unavailable in private browsing mode.',
        }
      }
      return { success: false, id: null, error: 'Failed to save submission.' }
    }

    return { success: true, id: submissionId, error: null }
  } catch {
    return {
      success: false,
      id: null,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
