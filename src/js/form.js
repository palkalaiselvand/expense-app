// form.js — DOM management, event handling, form lifecycle.
// Orchestrates validator.js and storage.js. All DOM interaction lives here.
// Security: textContent only for user-supplied data — never innerHTML.
// WCAG 2.1 AA: aria-describedby, aria-live, aria-invalid, focus management.

import {
  CATEGORIES,
  CATEGORY_LABELS,
  MAX_LINE_ITEMS,
} from "./constants.js";
import {
  validateDescription,
  validateCategory,
  validateAmount,
  validateDate,
  validateAttachment,
  validateForm,
} from "./validator.js";
import { saveSubmission } from "./storage.js";

let rowCounter = 0; // Monotonically increasing row ID suffix

// ─── Initialisation ──────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);

function init() {
  const form = document.getElementById("expense-form");
  const addBtn = document.getElementById("add-item-btn");

  // Populate the first row (cloned by template) and add to DOM
  addLineItem();

  addBtn.addEventListener("click", () => addLineItem());
  form.addEventListener("submit", handleSubmit);
}

// ─── Row Management ──────────────────────────────────────────────────────────

function getRowCount() {
  return document.querySelectorAll(".line-item").length;
}

/**
 * Clone the template, assign unique IDs to all inputs, and append to form.
 */
function addLineItem() {
  const container = document.getElementById("line-items");
  const template = document.getElementById("line-item-template");
  const clone = template.content.cloneNode(true);
  rowCounter++;
  const n = rowCounter;
  const count = getRowCount() + 1; // After this item is added

  // Re-suffix all IDs and for/aria-describedby attributes
  clone.querySelectorAll("[data-tmpl-id]").forEach((el) => {
    const base = el.getAttribute("data-tmpl-id");
    el.id = `${base}-${n}`;
    el.removeAttribute("data-tmpl-id");
  });
  clone.querySelectorAll("[data-tmpl-for]").forEach((el) => {
    const base = el.getAttribute("data-tmpl-for");
    el.setAttribute("for", `${base}-${n}`);
    el.removeAttribute("data-tmpl-for");
  });
  // Handle aria-describedby attributes that reference another tmpl element
  clone.querySelectorAll("[data-tmpl-aria-describedby]").forEach((el) => {
    const base = el.getAttribute("data-tmpl-aria-describedby");
    el.setAttribute("aria-describedby", `${base}-${n}`);
    el.removeAttribute("data-tmpl-aria-describedby");
  });
  clone.querySelectorAll("[data-tmpl-error-for]").forEach((el) => {
    const base = el.getAttribute("data-tmpl-error-for");
    el.id = `err-${base}-${n}`;
    el.removeAttribute("data-tmpl-error-for");
  });

  // Set the fieldset legend
  const fieldset = clone.querySelector("fieldset.line-item");
  const legend = fieldset.querySelector("legend");
  legend.textContent = `Line Item ${count}`;

  // Populate category dropdown
  const catSelect = fieldset.querySelector("select[name='category']");
  populateCategoryOptions(catSelect);

  // Set max date on date input to today
  const dateInput = fieldset.querySelector("input[name='date']");
  dateInput.setAttribute("max", todayISO());

  // Remove button — hide on first row
  const removeBtn = fieldset.querySelector(".remove-item-btn");
  removeBtn.addEventListener("click", () => handleRemoveLineItem(fieldset));

  // Bind blur validators
  bindRowValidators(fieldset, n);

  container.appendChild(clone);
  updateAddButtonState();
  updateLegends();
  updateRunningTotal();

  // Announce new item to screen readers
  const statusEl = document.getElementById("form-status");
  statusEl.textContent = `Line item ${count} added.`;

  // Focus the description field of the new row (skip on first row load)
  const existingCount = getRowCount();
  if (existingCount > 1) {
    fieldset.querySelector("input[name='description']").focus();
  }

  // Update remove button visibility on all rows
  updateRemoveButtons();
}

/**
 * Remove a line-item row from the form.
 */
function handleRemoveLineItem(rowEl) {
  const addBtn = document.getElementById("add-item-btn");
  rowEl.remove();
  updateAddButtonState();
  updateLegends();
  updateRunningTotal();
  updateRemoveButtons();

  const count = getRowCount();
  const statusEl = document.getElementById("form-status");
  statusEl.textContent = `Line item removed. ${count} item${count !== 1 ? "s" : ""} remaining.`;

  // Focus the Add button after removal
  addBtn.focus();
}

/**
 * Update legend text for all rows to reflect correct ordinal numbers.
 */
function updateLegends() {
  document.querySelectorAll(".line-item").forEach((row, i) => {
    const legend = row.querySelector("legend");
    if (legend) legend.textContent = `Line Item ${i + 1}`;
  });
}

/**
 * Show/hide remove buttons — always hide on the sole remaining row.
 */
function updateRemoveButtons() {
  const rows = document.querySelectorAll(".line-item");
  rows.forEach((row, i) => {
    const btn = row.querySelector(".remove-item-btn");
    if (btn) {
      btn.hidden = rows.length === 1;
      btn.setAttribute(
        "aria-label",
        `Remove line item ${i + 1}`
      );
    }
  });
}

/**
 * Enable/disable Add button and show limit message.
 */
function updateAddButtonState() {
  const addBtn = document.getElementById("add-item-btn");
  const limitMsg = document.getElementById("limit-reached-msg");
  const reached = getRowCount() >= MAX_LINE_ITEMS;
  addBtn.disabled = reached;
  if (limitMsg) limitMsg.hidden = !reached;
}

// ─── Category Options ─────────────────────────────────────────────────────────

function populateCategoryOptions(selectEl) {
  // Empty placeholder option
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a category\u2026";
  placeholder.disabled = true;
  placeholder.selected = true;
  selectEl.appendChild(placeholder);

  CATEGORIES.forEach((key) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = CATEGORY_LABELS[key] || key;
    selectEl.appendChild(opt);
  });
}

// ─── Field Validation Binding ─────────────────────────────────────────────────

function bindRowValidators(fieldset, n) {
  const descInput = fieldset.querySelector("input[name='description']");
  const catSelect = fieldset.querySelector("select[name='category']");
  const amtInput = fieldset.querySelector("input[name='amount']");
  const dateInput = fieldset.querySelector("input[name='date']");
  const fileInput = fieldset.querySelector("input[name='attachment']");

  descInput.addEventListener("blur", () => {
    const result = validateDescription(descInput.value);
    result.valid
      ? clearFieldError(descInput)
      : showFieldError(descInput, result.message);
  });
  descInput.addEventListener("input", () => {
    if (descInput.classList.contains("invalid")) {
      const result = validateDescription(descInput.value);
      result.valid ? clearFieldError(descInput) : null;
    }
  });

  catSelect.addEventListener("blur", () => {
    const result = validateCategory(catSelect.value);
    result.valid
      ? clearFieldError(catSelect)
      : showFieldError(catSelect, result.message);
    // Re-validate amount if already entered (limit is category-dependent)
    if (amtInput.value) {
      const amtResult = validateAmount(amtInput.value, catSelect.value);
      amtResult.valid
        ? clearFieldError(amtInput)
        : showFieldError(amtInput, amtResult.message);
      updateRunningTotal();
    }
  });

  amtInput.addEventListener("blur", () => {
    const result = validateAmount(amtInput.value, catSelect.value);
    result.valid
      ? clearFieldError(amtInput)
      : showFieldError(amtInput, result.message);
    updateRunningTotal();
  });
  amtInput.addEventListener("input", () => {
    if (amtInput.classList.contains("invalid")) {
      const result = validateAmount(amtInput.value, catSelect.value);
      if (result.valid) {
        clearFieldError(amtInput);
        updateRunningTotal();
      }
    } else {
      updateRunningTotal();
    }
  });

  dateInput.addEventListener("blur", () => {
    const result = validateDate(dateInput.value);
    result.valid
      ? clearFieldError(dateInput)
      : showFieldError(dateInput, result.message);
  });
  dateInput.addEventListener("input", () => {
    if (dateInput.classList.contains("invalid")) {
      const result = validateDate(dateInput.value);
      result.valid ? clearFieldError(dateInput) : null;
    }
  });

  fileInput.addEventListener("change", () => handleFileChange(fileInput, fieldset));
}

// ─── File Handling ────────────────────────────────────────────────────────────

function handleFileChange(fileInput, fieldset) {
  const file = fileInput.files[0] || null;
  const preview = fieldset.querySelector(".file-preview");
  const result = validateAttachment(file);

  if (!result.valid) {
    showFieldError(fileInput, result.message);
    if (preview) preview.textContent = "";
    // Clear selection so user must re-pick
    fileInput.value = "";
    return;
  }

  clearFieldError(fileInput);
  if (file && preview) {
    const sizeKB = (file.size / 1024).toFixed(1);
    // textContent only — never innerHTML — to prevent XSS
    preview.textContent = `${sanitizeForDisplay(file.name)} (${sizeKB} KB)`;
  } else if (preview) {
    preview.textContent = "";
  }
}

/** Strip path separators from filename for safe display via textContent. */
function sanitizeForDisplay(name) {
  return name.replace(/[/\\]/g, "").trim();
}

// ─── Running Total ────────────────────────────────────────────────────────────

function updateRunningTotal() {
  let total = 0;
  document.querySelectorAll(".line-item").forEach((row) => {
    const amtInput = row.querySelector("input[name='amount']");
    const catSelect = row.querySelector("select[name='category']");
    const val = parseFloat(amtInput ? amtInput.value : "");
    if (!isNaN(val) && val > 0) {
      const cat = catSelect ? catSelect.value : "";
      const r = validateAmount(val, cat);
      if (r.valid) total += val;
    }
  });
  const totalEl = document.getElementById("running-total");
  if (totalEl) {
    const formatted = total.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
    totalEl.textContent = `Total: ${formatted}`;
  }
}

// ─── Form Submission ──────────────────────────────────────────────────────────

function collectFormData() {
  const rows = document.querySelectorAll(".line-item");
  return Array.from(rows).map((row) => ({
    description: (row.querySelector("input[name='description']") || {}).value || "",
    category: (row.querySelector("select[name='category']") || {}).value || "",
    amount: (row.querySelector("input[name='amount']") || {}).value || "",
    date: (row.querySelector("input[name='date']") || {}).value || "",
    file: (row.querySelector("input[name='attachment']") || {}).files
      ? row.querySelector("input[name='attachment']").files[0] || null
      : null,
  }));
}

function handleSubmit(event) {
  event.preventDefault();

  // Clear previous success banner
  const banner = document.getElementById("success-banner");
  if (banner) banner.hidden = true;

  const formData = collectFormData();
  const { valid, itemErrors } = validateForm(formData);

  if (!valid) {
    // Show all inline errors
    const rows = document.querySelectorAll(".line-item");
    let firstInvalidEl = null;

    itemErrors.forEach(({ index, errors }) => {
      const row = rows[index];
      if (!row) return;

      if (errors.description) {
        const el = row.querySelector("input[name='description']");
        showFieldError(el, errors.description);
        if (!firstInvalidEl) firstInvalidEl = el;
      }
      if (errors.category) {
        const el = row.querySelector("select[name='category']");
        showFieldError(el, errors.category);
        if (!firstInvalidEl) firstInvalidEl = el;
      }
      if (errors.amount) {
        const el = row.querySelector("input[name='amount']");
        showFieldError(el, errors.amount);
        if (!firstInvalidEl) firstInvalidEl = el;
      }
      if (errors.date) {
        const el = row.querySelector("input[name='date']");
        showFieldError(el, errors.date);
        if (!firstInvalidEl) firstInvalidEl = el;
      }
      if (errors.attachment) {
        const el = row.querySelector("input[name='attachment']");
        showFieldError(el, errors.attachment);
        if (!firstInvalidEl) firstInvalidEl = el;
      }
    });

    // Scroll to and focus first error
    if (firstInvalidEl) {
      firstInvalidEl.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalidEl.focus();
    }

    // Announce summary to SR
    const statusEl = document.getElementById("form-status");
    statusEl.textContent =
      "Please correct the errors above before submitting.";
    return;
  }

  // All valid — save submission
  const result = saveSubmission(formData);

  if (!result.success) {
    const statusEl = document.getElementById("form-status");
    statusEl.textContent =
      result.error || "Submission failed. Please try again.";
    return;
  }

  // Show success banner
  if (banner) {
    banner.hidden = false;
    banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // textContent only — no user data in the banner
    banner.textContent = "Your expense report has been submitted successfully!";
  }

  // Announce to SR
  const statusEl = document.getElementById("form-status");
  statusEl.textContent = "Expense report submitted successfully.";

  // Reset form to single empty row
  resetForm();
}

function resetForm() {
  // Remove all line-item rows
  const container = document.getElementById("line-items");
  container.innerHTML = "";
  rowCounter = 0;

  // Add a fresh first row
  addLineItem();

  // Re-enable Add button / hide limit message
  updateAddButtonState();
  updateRunningTotal();
}

// ─── Field Error Helpers ──────────────────────────────────────────────────────

/**
 * Display an inline error message for a field.
 * Uses textContent only — never innerHTML.
 * Appends error span ID to aria-describedby (preserves hint references).
 */
function showFieldError(inputEl, message) {
  if (!inputEl) return;
  const errorSpan = findErrorSpan(inputEl);
  if (errorSpan) {
    errorSpan.textContent = message; // textContent only — WCAG + XSS safety
    // Append error span ID without displacing existing aria-describedby targets
    const current = inputEl.getAttribute("aria-describedby") || "";
    const ids = current.split(" ").filter((id) => id && id !== errorSpan.id);
    ids.push(errorSpan.id);
    inputEl.setAttribute("aria-describedby", ids.join(" "));
    inputEl.setAttribute("aria-invalid", "true");
  }
  inputEl.classList.add("invalid");
}

/**
 * Clear a field's inline error state.
 * Removes only the error span ID from aria-describedby, preserving hint references.
 */
function clearFieldError(inputEl) {
  if (!inputEl) return;
  const errorSpan = findErrorSpan(inputEl);
  if (errorSpan) {
    errorSpan.textContent = "";
    // Remove only the error span's ID from the describedby list
    const current = inputEl.getAttribute("aria-describedby") || "";
    const remaining = current
      .split(" ")
      .filter((id) => id && id !== errorSpan.id)
      .join(" ");
    if (remaining) {
      inputEl.setAttribute("aria-describedby", remaining);
    } else {
      inputEl.removeAttribute("aria-describedby");
    }
    inputEl.removeAttribute("aria-invalid");
  }
  inputEl.classList.remove("invalid");
}

/**
 * Locate the error <span> associated with a given input.
 * Error spans follow the pattern: id="err-<fieldname>-<rowcounter>"
 * and are the next or nearby sibling with class "field-error".
 */
function findErrorSpan(inputEl) {
  // Walk siblings to find the next .field-error span
  let el = inputEl.nextElementSibling;
  while (el) {
    if (el.classList.contains("field-error")) return el;
    el = el.nextElementSibling;
  }
  // Fallback: look in parent .form-group
  const group = inputEl.closest(".form-group");
  if (group) {
    return group.querySelector(".field-error");
  }
  return null;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
