// All TypeScript interfaces for the expense application

export type CategoryKey = 'Travel-Air' | 'Travel-Car' | 'Food' | 'Hotel' | 'Mobile'

export interface LineItem {
  id: string
  date: string           // YYYY-MM-DD (controlled input, may be empty)
  category: string       // key from settings categories, may be empty
  merchant: string
  description: string
  amount: string         // string to allow partial input (e.g. "1.", "")
  attachmentFile: File | null
  attachmentFileName: string | null
}

export interface LineItemErrors {
  date?: string
  category?: string
  merchant?: string
  description?: string
  amount?: string
  attachment?: string
}

export interface StoredLineItem {
  id: string
  date: string
  category: string
  merchant: string
  description: string
  amount: number
  attachmentFileName: string | null
}

export interface Submission {
  id: string
  submittedAt: string    // ISO-8601 UTC
  currency: 'USD'
  billableToClient: boolean
  lineItems: StoredLineItem[]
}

export interface FormErrors {
  itemErrors: Record<string, LineItemErrors>
}
