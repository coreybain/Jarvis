## 1. Backend
- [ ] 1.1 Add `POST /api/auth/desktop/onboard` endpoint that accepts onboarding payload and returns desktop auth tokens + user object.
- [ ] 1.2 Add backend validation for required fields and normalization rules (email format, max lengths, trimming).
- [ ] 1.3 Add backend tests for success, validation failure, and duplicate/abuse paths.

## 2. Desktop Main/IPC
- [x] 2.1 Add `auth:start-onboarding` IPC handler in `src/main/windows/main.ts` with sender + payload validation.
- [x] 2.2 Add `AuthManager.startOnboardingAuth(payload)` in `src/main/auth-manager.ts`.
- [x] 2.3 Reuse existing token persistence pipeline (encrypted auth store, cookie set, auth success broadcast, window reload).
- [x] 2.4 Add structured error propagation to renderer (`auth:error`) for validation/API failures.

## 3. Preload/Types
- [x] 3.1 Expose `desktopApi.startOnboardingAuth(payload)` in `src/preload/index.ts`.
- [x] 3.2 Add payload/return typings in `src/preload/index.d.ts`.

## 4. Renderer Login UX
- [x] 4.1 Replace login button UI in `src/renderer/login.html` with onboarding form fields (name, email, about, personality).
- [x] 4.2 Add client-side validation and disabled/loading states.
- [x] 4.3 Wire submit action to `desktopApi.startOnboardingAuth(payload)` and display error feedback.
- [x] 4.4 Keep `onAuthSuccess` handling unchanged so post-auth transition stays consistent.

## 5. Verification
- [ ] 5.1 Validate dev flow signs in without external browser.
- [ ] 5.2 Validate app restarts authenticated and token refresh still works.
- [ ] 5.3 Validate logout returns all windows to onboarding screen.
- [ ] 5.4 Validate fallback external auth flow still works when explicitly triggered.
