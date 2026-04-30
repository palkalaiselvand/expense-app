import { validateAmount, validateDate, validateDescription, validateCategory } from "./src/js/validator.js";


const tests = [
  { label: "Food $100 valid",           fn: () => validateAmount("100", "Food").valid === true },
  { label: "Food $100.01 invalid",      fn: () => validateAmount("100.01", "Food").valid === false },
  { label: "Travel-Air $5000 valid",    fn: () => validateAmount("5000", "Travel-Air").valid === true },
  { label: "Travel-Air $5000.01 INV",   fn: () => validateAmount("5000.01", "Travel-Air").valid === false },
  { label: "Hotel $500 valid",          fn: () => validateAmount("500", "Hotel").valid === true },
  { label: "Hotel $500.01 invalid",     fn: () => validateAmount("500.01", "Hotel").valid === false },
  { label: "Amount zero invalid",       fn: () => validateAmount("0", "Food").valid === false },
  { label: "Amount negative invalid",   fn: () => validateAmount("-1", "Food").valid === false },
  { label: "Amount non-numeric INV",    fn: () => validateAmount("abc", "Food").valid === false },
  { label: "Future date invalid",       fn: () => validateDate("2099-01-01").valid === false },
  { label: "Valid past date",           fn: () => validateDate("2025-01-15").valid === true },
  { label: "Empty date invalid",        fn: () => validateDate("").valid === false },
  { label: "Empty desc invalid",        fn: () => validateDescription("").valid === false },
  { label: "Valid desc",                fn: () => validateDescription("Flight NYC to LA").valid === true },
  { label: "201-char desc invalid",     fn: () => validateDescription("a".repeat(201)).valid === false },
  { label: "Valid category Travel-Air", fn: () => validateCategory("Travel-Air").valid === true },
  { label: "Empty category invalid",   fn: () => validateCategory("").valid === false },
  { label: "Unknown category invalid", fn: () => validateCategory("Groceries").valid === false },
];

let passed = 0, failed = 0;
tests.forEach(t => {
  try {
    if (t.fn()) { console.log("PASS:", t.label); passed++; }
    else { console.log("FAIL:", t.label); failed++; }
  } catch(e) { console.log("ERROR:", t.label, e.message); failed++; }
});
console.log(`\nResult: ${passed}/${passed+failed} tests passed`);
