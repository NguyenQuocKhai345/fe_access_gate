# TMC Access Control Center

React interface for the TMC backend services. It uses the API Gateway on port `8080`, Identity Service OAuth 2.0 Authorization Code with PKCE, and the backend response envelope (`data`, `code`, `message`).

## Local setup

1. Start the backend services required for the workflows you will use, including Config Server, Discovery, Identity, API Gateway, and the corresponding business service.
2. Copy `.env.example` to `.env` and check the local URLs.
3. Make sure the Identity Service has `IDENTITY_WEB_REDIRECT_URI=http://localhost:3000/callback`. The Vite dev server uses port `3000` to match the backend's default redirect URI and Gateway CORS allowlist.
4. Install dependencies with `npm install`, then run `npm run dev`.

The local backend needs an initial admin account and a generated Identity signing key before OAuth login works. Follow `be/docs/identity-api.md` and `be/docs/local-setup.md` for those backend steps. Do not put service or OAuth client secrets in this frontend: `tmc-web` is a public PKCE client.

## Environment

| Variable | Purpose | Local default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Business APIs through Gateway | `http://localhost:8080/api` |
| `VITE_IDENTITY_BASE_URL` | OAuth authorize redirect | `http://localhost:8081` |
| `VITE_OAUTH_TOKEN_URL` | PKCE code exchange through Gateway | `http://localhost:8080/api/identity/oauth2/token` |
| `VITE_OAUTH_CLIENT_ID` | Public OAuth client | `tmc-web` |
| `VITE_OAUTH_REDIRECT_URI` | Must exactly match Identity registration | `http://localhost:3000/callback` |
| `VITE_OAUTH_SCOPE` | Requested scopes | See `.env.example` |

The signed-in account still needs the backend role, factory grant, and scopes required by each operation. A missing grant is returned by the backend as an authorization error. Some service operations also depend on internal service credentials and live integrations configured in the backend.

## Available areas

- Employee accounts and permissions (`/api/identity`)
- Factory and gate station configuration (`/api/stations`)
- Employee QR issue and revoke (`/api/qr`)
- Attendance reports and period finalization (`/api/attendance`)
- Access evidence review (`/api/access`)
- Audit events and notifications (`/api/audit`)
- HR export and reconciliation (`/api/hr`)

Each operation displays the request method and path, accepts required path parameters and JSON bodies, and renders the API response for inspection.

## Commands

- `npm run dev` — local Vite server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run type-check` — TypeScript check
