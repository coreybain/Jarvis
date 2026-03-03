## Context
The current desktop auth model is browser/deep-link driven (`/auth/desktop` + callback + code exchange). We need a first-party desktop onboarding entry point that does not leave the app, while preserving downstream assumptions that desktop APIs require server-issued `X-Desktop-Token` credentials.

## Goals / Non-Goals
- Goals:
  - Enable in-app onboarding and authentication from the login screen.
  - Continue using server-issued token + refresh-token lifecycle.
  - Preserve post-auth behavior (cookie sync, auth success events, renderer reload).
- Non-Goals:
  - Replacing all existing external auth infrastructure.
  - Changing database schema for local auth storage.
  - Implementing anonymous/local-only auth.

## Decisions
- Decision: Add a backend endpoint for direct desktop onboarding auth.
  - Request payload: `{ name, email, about, personality, deviceInfo }`
  - Response payload: `{ token, refreshToken, expiresAt, user }` (same shape used today)
  - Rationale: Reuses existing auth persistence and refresh code paths with minimal risk.

- Decision: Add a new IPC method dedicated to onboarding auth submission.
  - Renderer invokes `desktopApi.startOnboardingAuth(payload)`.
  - Main validates sender and payload, then calls `AuthManager.startOnboardingAuth(payload)`.

- Decision: Reuse existing success pipeline instead of introducing a parallel session write path.
  - After onboarding response, save auth using the same store + cookie update + window reload logic as current exchange flow.

## Risks / Trade-offs
- Risk: Email-based onboarding without verification could allow mistaken identity or account collisions.
  - Mitigation: Backend enforces account policy (verification, rate limits, anti-abuse checks).
- Risk: Duplication between code-exchange and onboarding token-apply paths.
  - Mitigation: factor shared token-apply function in `AuthManager` or `index.ts`.
- Risk: Breaking existing auth flow unexpectedly.
  - Mitigation: keep existing `startAuthFlow` and deep-link callback logic as fallback.

## Migration Plan
1. Add backend endpoint and contract tests.
2. Add desktop IPC and main-process onboarding handler.
3. Update login UI to onboarding form + Start Building CTA.
4. Integrate new flow with existing session persistence and refresh.
5. Validate fallback external flow still works.

## Open Questions
- Should backend require email verification before issuing desktop tokens?
- Should onboarding fields be editable later in settings/profile?
- Should onboarding be gated behind a feature flag for phased rollout?
