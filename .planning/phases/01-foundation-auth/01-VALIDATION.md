---
phase: 1
slug: foundation-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (greenfield) — Jest + @testing-library/react via Wave 0 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~15 seconds (tsc) / ~30 seconds (test suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SEO-04 | — | N/A | static | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SEO-05 | — | .env.local gitignored | static | `git status --short .env*` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | LAYOUT-05 | — | N/A | manual | browser check: Fira Sans + brand colors | manual-only | ⬜ pending |
| 1-02-01 | 02 | 2 | AUTH-01 | T-role-spoof | publicMetadata role = server-write only | manual | manual Clerk onboarding flow | manual-only | ⬜ pending |
| 1-02-02 | 02 | 2 | AUTH-03 | T-middleware-bypass | Wrong-role user redirected away | unit | `npm test -- middleware` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | AUTH-04 | T-stale-session | user.reload() forces JWT refresh | manual | manual sign-up → onboarding → dashboard | manual-only | ⬜ pending |
| 1-02-04 | 02 | 2 | AUTH-05 | — | Sign-out clears session | manual | manual browser sign-out | manual-only | ⬜ pending |
| 1-03-01 | 03 | 3 | LAYOUT-01 | — | N/A | unit | `npm test -- Sidebar` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 3 | LAYOUT-02 | — | N/A | unit | `npm test -- Sidebar.collapsed` | ❌ W0 | ⬜ pending |
| 1-03-03 | 03 | 3 | LAYOUT-03 | — | N/A | unit | `npm test -- Navbar` | ❌ W0 | ⬜ pending |
| 1-03-04 | 03 | 3 | LAYOUT-04 | — | N/A | unit | `npm test -- Footer` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/components/Sidebar.test.tsx` — stubs for LAYOUT-01, LAYOUT-02
- [ ] `src/__tests__/components/Navbar.test.tsx` — stub for LAYOUT-03
- [ ] `src/__tests__/components/Footer.test.tsx` — stub for LAYOUT-04
- [ ] `src/__tests__/middleware.test.ts` — stub for AUTH-03 (role-based redirect logic)
- [ ] Test framework install: `npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User signs up and role written to Clerk publicMetadata | AUTH-01 | Requires Clerk live environment + browser session | Sign up → /onboarding → select role → verify role in Clerk Dashboard |
| JWT refresh after onboarding (user.reload()) | AUTH-04 | Requires live Clerk session token inspection | Sign up → /onboarding → select role → confirm dashboard loads (no redirect loop) |
| Sign-out clears session and redirects to /sign-in | AUTH-05 | Requires browser session | Click sign-out from each dashboard → confirm /sign-in redirect |
| Fira Sans + brand colors applied correctly | LAYOUT-05 | Visual verification required | Open devtools → computed styles show Fira Sans + correct hex values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
