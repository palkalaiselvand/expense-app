// Settings types — all user-configurable values for the FinCorp Expense Manager.

export interface CategorySetting {
  /** Stable unique identifier (e.g. 'Travel-Air', 'cat-1714000000000') */
  key: string
  /** Human-readable display name */
  label: string
  /** Per-line-item spending cap in USD */
  limit: number
  /** Hex accent color used for chips and icons */
  color: string
}

export interface AppSettings {
  categories: CategorySetting[]
  /** How many calendar days back an employee may submit an expense */
  submissionWindowDays: number
  /** Whether to allow submissions outside the window */
  allowLateSubmissions: boolean
  /** Maximum line items allowed per report */
  maxItemsPerReport: number
  /** Maximum total USD amount allowed per report */
  maxAmountPerReport: number
  /** ISO timestamp of the last save */
  lastEditedAt?: string
}
