// validator.ts — Pure, stateless validation functions.
// Each returns { valid, message }. No side effects, no DOM interaction.

import {
  CATEGORY_LIMITS,
  ALLOWED_MIME_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '../constants/expense'
import type { CategoryKey, LineItem, LineItemErrors } from '../types/expense'

interface ValidationResult {
  valid: boolean
  message: string
}

export function validateDescription(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) return { valid: false, message: 'Description is required.' }
  if (trimmed.length > 200)
    return { valid: false, message: 'Description must be 200 characters or fewer.' }
  return { valid: true, message: '' }
}

export function validateCategory(value: string): ValidationResult {
  if (!value) return { valid: false, message: 'Please select a category.' }
  if (!(value in CATEGORY_LIMITS))
    return { valid: false, message: 'Please select a valid category.' }
  return { valid: true, message: '' }
}

export function validateAmount(value: string, category: string): ValidationResult {
  if (!value || value.trim() === '')
    return { valid: false, message: 'Amount is required.' }
  const num = parseFloat(value)
  if (isNaN(num))
    return { valid: false, message: 'Amount must be a positive number.' }
  if (num <= 0)
    return { valid: false, message: 'Amount must be greater than $0.00.' }
  const rounded = Math.round(num * 100) / 100
  if (category && category in CATEGORY_LIMITS) {
    const limit = CATEGORY_LIMITS[category as CategoryKey]
    if (rounded > limit) {
      const formatted = limit.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      const label = category.replace('-', ' \u2013 ')
      return {
        valid: false,
        message: `Amount exceeds the $${formatted} limit for ${label}.`,
      }
    }
  }
  return { valid: true, message: '' }
}

export function validateDate(value: string): ValidationResult {
  if (!value || value.trim() === '')
    return { valid: false, message: 'Date is required.' }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value.trim()))
    return { valid: false, message: 'Please enter a valid date.' }
  const entered = new Date(value.trim() + 'T00:00:00')
  if (isNaN(entered.getTime()))
    return { valid: false, message: 'Please enter a valid date.' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (entered > today)
    return { valid: false, message: 'Expense date cannot be in the future.' }
  return { valid: true, message: '' }
}

export function validateAttachment(file: File | null): ValidationResult {
  if (!file) return { valid: true, message: '' }
  const ext = ('.' + (file.name.split('.').pop() ?? '')).toLowerCase()
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type)
  const extOk = ALLOWED_FILE_EXTENSIONS.includes(ext)
  if (!mimeOk || !extOk)
    return { valid: false, message: 'Only PDF, JPG, and PNG files are accepted.' }
  if (file.size > MAX_FILE_SIZE_BYTES)
    return { valid: false, message: 'File must be 5 MB or smaller.' }
  return { valid: true, message: '' }
}

/** Strip path separators from a filename before storing (prevent path traversal). */
export function sanitizeFileName(file: File): string {
  return file.name.replace(/[/\\]/g, '').trim()
}

export function validateLineItem(item: LineItem): { valid: boolean; errors: LineItemErrors } {
  const errors: LineItemErrors = {}

  const dateRes = validateDate(item.date)
  if (!dateRes.valid) errors.date = dateRes.message

  const catRes = validateCategory(item.category)
  if (!catRes.valid) errors.category = catRes.message

  const amtRes = validateAmount(item.amount, item.category)
  if (!amtRes.valid) errors.amount = amtRes.message

  const descRes = validateDescription(item.description)
  if (!descRes.valid) errors.description = descRes.message

  const fileRes = validateAttachment(item.attachmentFile)
  if (!fileRes.valid) errors.attachment = fileRes.message

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateAllLineItems(items: LineItem[]): {
  valid: boolean
  errors: Record<string, LineItemErrors>
} {
  const allErrors: Record<string, LineItemErrors> = {}
  let allValid = true

  items.forEach((item) => {
    const { valid, errors } = validateLineItem(item)
    if (!valid) {
      allErrors[item.id] = errors
      allValid = false
    }
  })

  return { valid: allValid, errors: allErrors }
}
