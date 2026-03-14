# Sleep Not Included — Frontend

Angular 20 frontend for the SleepNotIncluded community platform — a web application where players of *Oxygen Not Included* can share, browse, and discuss in-game builds. The frontend communicates with a distributed Spring Boot microservices backend through auto-generated OpenAPI TypeScript clients, secured via OAuth2/OIDC with Keycloak.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Client Generation](#api-client-generation)
- [Authentication](#authentication)
- [Contributing](#contributing)

---

## Features

- Browse, search, and filter community builds with pagination
- Create builds with thumbnail and multi-image upload (drag & drop supported)
- Tagging system for categorising builds
- Threaded comment system with nested replies, edit, and delete
- View detailed game resource data (buildings, materials, stats)
- Full authentication flow — login, register, logout, silent token refresh via Keycloak OIDC
- Role-based UI visibility tied to Keycloak realm roles

---

## Tech Stack

**Framework & Language**
- Angular 20 (standalone components)
- TypeScript

**State Management**
- Angular Signals (`signal`, `computed`) — no NgRx or external state library

**Authentication**
- `angular-oauth2-oidc` — OAuth2 Authorization Code flow with PKCE
- Keycloak as the identity provider
- Automatic silent token refresh

**API Communication**
- Auto-generated TypeScript clients via **OpenAPI Generator** (`openapi-generator-cli`)
- One client library per backend microservice (user, build, comment, tag, image, gameres)
- HTTP interceptor injects Bearer token into all outgoing requests

**Styling**
- Custom CSS with CSS variables for theming
- Responsive layouts


---

## Project Structure

```
src/
├── app/
│   ├── api/                        # Auto-generated OpenAPI clients (do not edit manually)
│   │   ├── user-service/
│   │   ├── build-service/
│   │   ├── comment-service/
│   │   ├── tag-service/
│   │   ├── image-service/
│   │   └── gameres-service/
│   ├── auth/                       # Auth service, config, and HTTP interceptor
│   │   ├── auth.service.ts
│   │   ├── auth.config.ts
│   │   └── auth.interceptor.ts
│   ├── pages/                      # Feature pages (routed components)
│   │   ├── build/
│   │   │   ├── build-list/
│   │   │   ├── build-detail/
│   │   │   │   └── comment-section/
│   │   │   └── build-create/
│   │   └── ...
│   ├── app.routes.ts
│   └── app.config.ts
```

> The `api/` directories are fully generated — do not edit them by hand. Re-generate them when backend contracts change (see [API Client Generation](#api-client-generation)).

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Angular CLI 20: `npm install -g @angular/cli`
- A running backend (gateway accessible at `http://localhost:8080`)
- A running Keycloak instance at `http://localhost:8443` with the `${realmName}` realm configured

### 1. Clone the repository

```bash
git clone https://github.com/your-org/sleep-not-included-frontend.git
cd sleep-not-included-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
ng serve
```

The application will be available at `http://localhost:4200`. The dev server proxies API requests to the gateway and hot-reloads on file changes.

---

## Environment Configuration

Authentication and API base paths are configured in `src/app/auth/auth.config.ts`. Update the following values to match your environment:

```typescript
export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8443/realms/${realmName}',
  redirectUri: window.location.origin + '/',
  clientId: '${frontendClientId}',
  responseType: 'code',
  scope: 'openid profile email',
  useSilentRefresh: true,
};
```

API base paths for each generated client are provided in `src/app/app.config.ts` via the `provideApi()` helpers pointing to the gateway at `http://localhost:8080`.

---

## API Client Generation

The `src/app/api/` clients are generated automatically from live OpenAPI specs served by each backend service. Ensure all backend services are running before regenerating.

```bash
npx openapi-generator-cli generate
```

Generator configuration is defined in `openapitools.json` at the project root. Each service has its own generator entry:

| Generator key | Source spec | Output directory |
|---|---|---|
| `user-service` | `http://localhost:8081/api/v1/v3/api-docs` | `src/app/api/user-service` |
| `build-service` | `http://localhost:8082/api/v1/v3/api-docs` | `src/app/api/build-service` |
| `comment-service` | `http://localhost:8083/api/v1/v3/api-docs` | `src/app/api/comment-service` |
| `tag-service` | `http://localhost:8084/api/v1/v3/api-docs` | `src/app/api/tag-service` |
| `image-service` | `http://localhost:8085/api/v1/v3/api-docs` | `src/app/api/image-service` |
| `gameres-service` | `http://localhost:8086/api/v1/v3/api-docs` | `src/app/api/gameres-service` |

> Always commit regenerated clients alongside backend contract changes.

---

## Authentication

Authentication is handled by `AuthService` (`src/app/auth/auth.service.ts`) wrapping `angular-oauth2-oidc`.

| Method | Description |
|---|---|
| `initAuth()` | Called on app bootstrap — loads OIDC discovery document, attempts silent login, sets up automatic token refresh |
| `login()` | Initiates Authorization Code + PKCE flow, redirecting to Keycloak |
| `register()` | Redirects to Keycloak registration page |
| `logout()` | Revokes token and logs out |
| `isLoggedIn` | Returns `true` if a valid access token exists |
| `userProfile` | Returns decoded identity claims from the ID token |
| `accessToken` | Returns the raw JWT access token |

On first login, `AuthService` calls the user service to sync the Keycloak identity (`sub` claim) with the application's internal user record.

The HTTP interceptor (`auth.interceptor.ts`) automatically attaches the `Authorization: Bearer <token>` header to all outgoing API requests.

---

## Contributing

As of now I run this as a solo project, but for possible future contributions, here is a basic workflow.

### Branching Strategy

```
master        — stable, production-ready
develop       — integration branch for features
feature/*     — individual feature branches
fix/*         — bug fixes
```

### Workflow

1. Fork the repository and create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
