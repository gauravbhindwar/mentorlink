# MentorLink Detailed README

MentorLink is a mentorship management platform for handling mentor-mentee relationships, meeting workflows, academic session transitions, and archive reporting.

## Documentation Map

- API reference: `docs/API_REFERENCE.md`
- Folder guide: `docs/FOLDER_STRUCTURE.md`
- Existing project README: `README.md`

## Tech Stack

- Frontend: Next.js App Router, React 18, Tailwind CSS, MUI, Framer Motion
- Backend/API: Next.js Route Handlers, next-auth, MongoDB + Mongoose
- State & Validation: Redux Toolkit, Zustand, Joi, Zod
- Reporting & Utilities: jsPDF, xlsx, nodemailer, PostHog

## Prerequisites

- Node.js 18+ (recommended for Next 15 compatibility)
- npm 9+
- MongoDB instance (local, Atlas, or managed service)

## Local Development Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

- Add `.env.local` (or `.env`) in project root.
- Populate required variables from the Environment Variables section below.

3. Run development server

```bash
npm run dev
```

4. Open app

- Default URL: `http://localhost:3000`

## Environment Variables

Based on project usage (`process.env.*`) and Next config.

### Required (Core)

- `MONGODB_URI`
  - Mongo connection string
- `NEXTAUTH_SECRET`
  - Secret used by next-auth
- `NEXTAUTH_URL`
  - Application base URL for auth callbacks

### Required (Auth + Verification)

- `RECAPTCHA_SECRET_V3_KEY`
  - Server-side captcha verification key
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
  - Public reCAPTCHA site key used in client login flow

### Required (Email Integration)

- `GITHUB_PAT_TOKEN`
  - Token used in configured email API calls
- `APPLICATION_NAME`
  - Application identifier used in outbound email payloads

### Optional / Analytics

- `NEXT_PUBLIC_POSTHOG_KEY`
  - PostHog project key for telemetry
- `ENV`
  - Mapped to `NEXT_PUBLIC_ENV` in `next.config.js`
- `NODE_ENV`
  - Runtime mode (`development`/`production`)
- `STORAGE_SECRET_KEY`
  - Storage encryption helper key (fallback exists but should be explicitly set)

## Available Scripts

- `npm run dev`
  - Starts Next.js dev server with Turbopack
- `npm run build`
  - Production build (`next build`) with source-map generation disabled
- `npm run start`
  - Starts built production server
- `npm run lint`
  - Runs Next.js lint checks

## Docker Deployment (Infra)

The repository includes production-oriented container assets in `infra/`.

### Build and run with Compose

```bash
cd infra
docker compose up --build
```

- App container listens on port `3001`
- Compose expects `../.env.production`
- Optional MongoDB container scaffold is present but commented in compose file

## Application Structure (Quick Guide)

- `src/app`: App Router pages and API handlers
- `src/app/api`: backend API domains (`admin`, `auth`, `meeting`, `mentor`, `mentee`, `archive`)
- `src/components`: feature and shared UI components
- `src/lib`: DB, auth, mail, analytics service layer
- `src/utils`: utility helpers (academic year, validation, secure storage)

For full details, see `docs/FOLDER_STRUCTURE.md`.

## API Usage Notes

- API base path is `/api`
- Handlers use Next.js App Router route conventions
- Query parameters are read from URL search params
- JSON payloads are parsed via `await request.json()`

For full endpoint coverage and status behavior, see `docs/API_REFERENCE.md`.

## Development Guidelines

- Keep route contracts stable and explicit (query/body validation)
- Reuse domain modules in `src/lib/db` for schema consistency
- Maintain role-based access checks where admin/mentor boundaries apply
- Prefer centralized error response shapes for easier frontend handling

## Troubleshooting

- Build fails on env references:
  - Verify all required env variables are set before `npm run build`
- Auth callback/session issues:
  - Confirm `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- Database connection issues:
  - Validate `MONGODB_URI` and network access to MongoDB endpoint
- reCAPTCHA validation fails:
  - Check site/secret key pair and domain registration in Google console

## Maintenance Checklist

- Update `docs/API_REFERENCE.md` when adding/changing route handlers
- Update `docs/FOLDER_STRUCTURE.md` when moving modules or introducing new domains
- Keep this README aligned with script, env, and deployment changes
