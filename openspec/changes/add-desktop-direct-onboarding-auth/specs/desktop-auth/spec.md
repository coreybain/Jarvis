## ADDED Requirements

### Requirement: In-App Desktop Onboarding Authentication
The desktop app SHALL provide an in-app onboarding authentication flow that does not require opening an external browser for initial sign-in.

#### Scenario: Successful onboarding sign-in
- **WHEN** a user submits valid onboarding data (name, email, about, personality) from the desktop login screen
- **THEN** the app SHALL authenticate the user via backend direct onboarding endpoint
- **AND** the app SHALL persist returned auth data using the existing desktop auth storage mechanism
- **AND** the app SHALL transition the user from login screen to the authenticated app view

#### Scenario: Invalid onboarding input
- **WHEN** a user submits missing or invalid onboarding fields
- **THEN** the app SHALL not start authentication
- **AND** the app SHALL display actionable validation errors on the login screen

#### Scenario: Backend onboarding rejection
- **WHEN** backend onboarding returns an error response
- **THEN** the app SHALL keep the user on the login screen
- **AND** the app SHALL display an error message
- **AND** the app SHALL not persist partial/invalid auth credentials

### Requirement: Desktop Token Compatibility
The onboarding flow SHALL produce credentials compatible with existing desktop authenticated API behavior.

#### Scenario: Authenticated API usage after onboarding
- **WHEN** onboarding authentication succeeds
- **THEN** the app SHALL attach valid desktop auth token headers for authenticated backend requests
- **AND** existing authenticated desktop features SHALL remain functional without additional login steps

#### Scenario: Token refresh continuity
- **WHEN** an onboarding-authenticated session nears token expiry
- **THEN** the app SHALL use the existing refresh mechanism
- **AND** refreshed credentials SHALL update local auth state and desktop cookie state
