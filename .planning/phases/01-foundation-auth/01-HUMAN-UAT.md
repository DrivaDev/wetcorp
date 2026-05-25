---
status: partial
phase: 01-foundation-auth
source: [01-VERIFICATION.md]
started: 2026-05-25
updated: 2026-05-25
---

## Current Test

Auth flow approved. Sidebar/layout tests pending.

## Tests

### 1. Sign-up → onboarding → dashboard (no loop)
expected: Register new user → /onboarding appears → select role → redirected to /{role}/dashboard → no redirect back to /onboarding
result: approved (tested by user 2026-05-25)

### 2. Cross-role protection
expected: Sign in as importador → visit /proveedor/dashboard → redirected to /importador/dashboard
result: [pending]

### 3. Auth page ejection for authenticated user
expected: Authenticated user with role visits /sign-in → redirected to /{role}/dashboard (not shown sign-in page)
result: [pending]

### 4. Desktop sidebar collapse (≥1024px)
expected: Sidebar expanded by default, collapse button shrinks to w-16, reload restores state from localStorage
result: [pending]

### 5. Mobile sidebar overlay (<640px)
expected: Only sticky top navbar visible; hamburger opens slide-in panel; clicking backdrop closes it
result: [pending]

## Summary

total: 5
passed: 1
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
