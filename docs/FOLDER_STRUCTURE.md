# MentorLink Folder Structure

This document explains the project layout and the responsibility of each major folder.

## Repository Layout (High-Level)

```text
mentor-mentee/
├── infra/                    # Docker and container orchestration assets
├── public/                   # Static assets served as-is
├── scripts/                  # Utility scripts for maintenance/migrations
├── src/                      # Application source code
├── components.json           # UI/component ecosystem metadata
├── next.config.js            # Next.js runtime and build configuration
├── package.json              # Dependencies and npm scripts
├── tailwind.config.ts        # Tailwind theme/config
├── tsconfig.json             # TypeScript compiler configuration
└── README.md                 # Existing quick project README
```

## Infrastructure Layer

### `infra/`

- `dockerfile`
  - Multi-stage Docker build (`deps` → `builder` → `runner`)
  - Builds standalone Next.js output and runs as non-root user
  - Exposes app on port `3001`
- `docker-compose.yml`
  - Production-like app service with `.env.production`
  - Optional MongoDB service scaffold (currently commented)

## Public Assets

### `public/`

- `fonts/`: custom static fonts
- `Peoples/Developer` and `Peoples/Faculty`: static imagery/content assets
- Files under `public/` map directly to URL paths

## Application Source (`src/`)

```text
src/
├── app/                      # Next.js App Router pages and API handlers
│   ├── api/                  # Route handlers (/api/*)
│   ├── pages/                # Legacy-style nested page routes for dashboards
│   ├── about/                # About page route
│   ├── archives/             # Archive page route
│   ├── components/           # App-local components
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── metadata.ts           # Metadata config
│   └── page.tsx              # Landing route
├── assets/                   # In-app assets (not directly public URLs)
├── components/               # Reusable UI/business components
├── context/                  # React context providers
├── lib/                      # DB, auth, mail, analytics, shared services
├── store/                    # Client state stores (e.g., Zustand)
├── styles/                   # Style helper modules
├── types/                    # Type declarations and augmentation
├── utils/                    # Generic utility functions
├── middleware.ts             # Route access middleware
└── routes.js                 # Additional route mapping helpers
```

## API Area Breakdown (`src/app/api`)

The API is organized by functional domain:

- `admin/`
  - Academic session lifecycle, user management, mentor assignment, search, and admin reporting
- `auth/`
  - OTP/password auth flows and next-auth integration
- `meeting/` and `meetings/`
  - Scheduling, report submission, mentor/mentee meeting views
- `mentor/`
  - Mentor profile and mentee management operations
- `mentee/`
  - Mentee details and attendance tracking
- `archive/`
  - Historical data retrieval and report downloads

## Component Organization

### `src/components/`

- `AdminDash/`: admin-focused containers and submodules
- `Meetings/`: meeting scheduling/reporting UI pieces
- `MenteeDash/`: mentee dashboard UI
- `mentor/`: mentor-specific reusable components
- `Navbar/`, `Login/`, `HomePage/`, `AboutUs/`: core page modules
- `common/` and `ui/`: shared cross-domain building blocks

## Data and Service Layer

### `src/lib/`

- `dbConfig.tsx`: MongoDB/Mongoose connection bootstrap
- `db/`: schema modules (academic sessions, mentors, mentees, meetings, etc.)
- `authOptions.js`: next-auth provider and callback config
- `mailService.js` / `nodemailer.js`: email delivery wrappers
- `posthog.ts`: analytics client initialization

### `src/utils/`

- Academic year logic
- Browser storage wrappers (secure local/session storage)
- Encryption and password validation helpers

## Routing and Access Control

- App routing: file-based under `src/app/`
- API routing: route handlers under `src/app/api/**/route.js`
- Protected page access: enforced by `src/middleware.ts` based on `UserRole` cookie and route prefixes

## Conventions Used in This Repository

- Most route handlers are JavaScript (`route.js`) in App Router format
- Mixed TS/JS codebase (`.tsx`, `.ts`, `.jsx`, `.js`)
- Domain-first folder grouping under both APIs and components
- Backend integration co-located in `src/lib` and consumed by routes/components

## Suggested Documentation Navigation

- API contracts and endpoint reference: `docs/API_REFERENCE.md`
- Setup, scripts, and runtime usage: `docs/README_DETAILED.md`
