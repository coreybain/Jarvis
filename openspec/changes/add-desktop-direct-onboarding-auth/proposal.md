# Change: Add direct desktop onboarding authentication

## Why
The current desktop sign-in requires opening an external browser auth page. For early onboarding and rapid product iteration, we want a fully in-app welcome flow that collects profile context and signs the user in directly.

## What Changes
- Replace the current login-page "Sign in" button flow with an in-app onboarding form.
- Collect onboarding fields on the desktop login screen: name, email, short self-description, and preferred agent personality.
- Add a main-process auth path that submits onboarding payload directly to backend and receives standard desktop auth tokens.
- Keep existing session persistence behavior (encrypted auth store, desktop cookie, refresh schedule, window reload after auth success).
- Keep deep-link/external flow support available for backward compatibility and operational fallback.

## Impact
- Affected specs: `desktop-auth` (new capability)
- Affected code:
  - `src/renderer/login.html`
  - `src/preload/index.ts`
  - `src/preload/index.d.ts`
  - `src/main/windows/main.ts`
  - `src/main/auth-manager.ts`
  - `src/main/index.ts`
