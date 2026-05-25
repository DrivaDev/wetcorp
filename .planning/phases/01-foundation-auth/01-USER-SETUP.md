# Plan 01-02 — User Setup Required

This plan writes all the code for Clerk authentication. Before running the app and testing, you must complete the following manual steps.

---

## Step 1: Create a Clerk account and application

1. Go to https://clerk.com and sign up (free tier is sufficient)
2. Create a new application
3. Choose "Email / Password" as the sign-in method (disable social providers for simplicity in dev)

---

## Step 2: Set environment variables in `.env.local`

Create (or update) `C:\Users\Equipo\Documents\DrivaOC\.env.local` with the following values:

```env
# Clerk — copy from: Clerk Dashboard → Configure → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<your-publishable-key>
CLERK_SECRET_KEY=sk_test_<your-secret-key>

# Clerk redirect URLs — keep these exactly as shown
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/onboarding
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding
```

Where to find the keys:
- Log in to https://dashboard.clerk.com
- Select your application
- Go to: Configure → API Keys
- Copy "Publishable key" → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Copy "Secret keys" → `CLERK_SECRET_KEY`

IMPORTANT: Never commit `.env.local`. It is already in `.gitignore`.

---

## Step 3: Customize the Clerk session token (CRITICAL)

Without this step, `sessionClaims.metadata.role` is always `undefined` in the middleware — route protection will not work and all authenticated users will be stuck in a redirect loop to `/onboarding`.

1. In Clerk Dashboard, go to: **Configure → Sessions → Customize session token**
2. Click "Edit" or enable the custom token toggle
3. Add the following JSON in the claims editor:

```json
{"metadata": "{{user.public_metadata}}"}
```

4. Save the changes

This embeds your `publicMetadata.role` into the JWT so middleware can read it at the edge without a network call.

---

## Step 4: Run the development server

```bash
cd C:\Users\Equipo\Documents\DrivaOC
npm run dev
```

The app will be available at http://localhost:3000

---

## Step 5: Manual test checklist

Test the full authentication flow in order:

- [ ] **Sign up:** Visit http://localhost:3000/sign-up — create a new account with email/password
- [ ] **Onboarding redirect:** After sign-up you should be redirected to http://localhost:3000/onboarding automatically
- [ ] **Role selection:** The onboarding page shows 3 cards — Importador, Proveedor, Despachante — click one to select it
- [ ] **Continuar button:** Click "Continuar" — you should see a loading spinner briefly
- [ ] **Dashboard redirect:** After clicking Continuar you should be redirected to:
  - `/importador/dashboard` if you selected Importador
  - `/proveedor/dashboard` if you selected Proveedor
  - `/despachante/dashboard` if you selected Despachante
- [ ] **No redirect loop:** Dashboard page shows "Dashboard" heading and "Esta sección está en construcción." — NOT a redirect back to onboarding
- [ ] **Cross-role protection:** Sign in with an importador account, then manually visit `/proveedor/dashboard` — you should be redirected to `/importador/dashboard`
- [ ] **Sign out:** Use Clerk's built-in user button (visible in the auth flow) — you should be redirected to `/sign-in`
- [ ] **Unauthenticated access:** Sign out, then visit `/importador/dashboard` directly — you should be redirected to `/sign-in`

---

## Troubleshooting

**Stuck in loop between /onboarding and /dashboard:**
- Most likely cause: Session token not customized in Clerk Dashboard (Step 3 above)
- Fix: Complete Step 3, then sign out and sign in again to get a fresh JWT

**"Clerk: publishable key not found" error:**
- `.env.local` is missing or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not set
- Restart `npm run dev` after editing `.env.local`

**"Unauthorized" or 401 in Server Action:**
- `CLERK_SECRET_KEY` is missing or incorrect in `.env.local`
- Restart `npm run dev` after editing `.env.local`

**All users redirected to /sign-in even when signed in:**
- Check that `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` is set in `.env.local`
- Check that the Clerk publishable key matches the application you configured in Step 3
