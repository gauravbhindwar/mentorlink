# MentorLink API Reference

Detailed, code-aligned reference for all App Router endpoints under `src/app/api`.

## Scope

- Total route handlers: **64**
- Base path: **`/api`**
- Runtime style: Next.js App Router Route Handlers (`route.js`)
- Conventions validated against Context7 Next.js docs (`/vercel/next.js`):
  - Method exports: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
  - Body parsing with `await request.json()`
  - Query parsing through `new URL(request.url).searchParams`
  - Responses via `NextResponse.json(...)` / `Response.json(...)`

## Global API Behavior

### Authentication and Session

- Authentication is handled by:
  - `next-auth` route: `/api/auth/[...nextauth]`
  - custom auth flow routes (`/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/login-password`)
- Role/session cookie used in current flow:
  - Cookie name: `UserRole`
  - Set as: `httpOnly`, `sameSite: strict`, `path: /`
  - `secure` flag toggled by `NODE_ENV === "production"`
  - Max age: 24 hours (observed in auth handlers)

### Error Shape (Observed)

Common error envelopes include one or more of:

```json
{ "error": "..." }
```

```json
{ "success": false, "message": "..." }
```

```json
{ "error": "...", "details": "..." }
```

### Status Codes (Observed)

- Success: `200`, `201`
- Client errors: `400`, `401`, `403`, `404`, `409`
- Server errors: `500`

## Detailed Contracts (High-Traffic / Core Flows)

The sections below include request contracts, validation rules, and sample responses derived from route code.

---

### 1) Send OTP

- **Endpoint:** `POST /api/auth/send-otp`
- **Purpose:** Generates a 6-digit OTP, stores hashed OTP for mentor, sends OTP via mail service.

**Request Body**

```json
{ "email": "mentor@example.edu" }
```

**Validation / Rules**

- `email` is required.
- User must exist in mentor collection.
- OTP is stored hashed (`bcrypt`) with ~10-minute expiry.

**Success Response**

```json
{ "success": true, "message": "OTP sent" }
```

**Error Cases**

- `400`: missing email
- `500`: user not found / mail delivery failure / DB failure

---

### 2) Verify OTP

- **Endpoint:** `POST /api/auth/verify-otp`
- **Purpose:** Validates OTP and establishes authenticated session context.

**Request Body**

```json
{ "email": "mentor@example.edu", "otp": "123456" }
```

**Validation / Rules**

- `email` + `otp` required in request body.
- Fails if OTP missing, expired, already used, or hash mismatch.
- On success marks OTP as used.

**Success Response (observed shape)**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "role": ["mentor"],
  "MUJid": "MUJ00001",
  "mujid": "MUJ00001",
  "email": "mentor@example.edu",
  "name": "User Name",
  "needsPasswordSetup": true,
  "token": "authenticated"
}
```

**Error Cases**

- `400`: invalid method payload / invalid or expired OTP
- `403`: missing role
- `404`: user not found
- `500`: server error

---

### 3) Login with Password

- **Endpoint:** `POST /api/auth/login-password`
- **Purpose:** Password login for mentor/admin accounts.

**Request Body**

```json
{ "email": "mentor@example.edu", "password": "Secret@123" }
```

**Validation / Rules**

- Requires both `email` and `password`.
- Searches in Mentor first, then Admin.
- Rejects users without password setup.

**Success Response (observed shape)**

```json
{
  "success": true,
  "message": "Login successful",
  "role": ["mentor"],
  "MUJid": "MUJ00001",
  "mujid": "MUJ00001",
  "email": "mentor@example.edu",
  "name": "User Name",
  "token": "authenticated"
}
```

**Error Cases**

- `400`: missing fields / no password setup
- `401`: invalid password
- `404`: user not found
- `500`: server error

---

### 4) Create / List Academic Sessions

- **Endpoint:** `POST /api/admin/academicSession`
- **Purpose:** Create an academic session year and nested sessions.

**Request Body (minimum observed contract)**

```json
{
  "start_year": 2025,
  "end_year": 2026,
  "sessions": [{ "name": "Odd", "semesters": [{ "semester_number": 5 }] }]
}
```

**Rules**

- Requires `start_year`, `end_year`, `sessions`.
- Rejects duplicate session for same academic year/session name.
- Auto-sets `isCurrent=true` if no current session exists.

**Responses**

- `200`: `{ message, isCurrent }`
- `400`: missing required fields
- `409`: duplicate session
- `500`: server error

**Endpoint:** `GET /api/admin/academicSession`

- Returns sorted session list prioritizing:
  1) current sessions, 2) unarchived non-current, 3) archived

---

### 5) Change Academic Session to Upcoming

- **Endpoint:** `PUT /api/admin/academicSession/changeToUpcoming`
- **Purpose:** Transactional rollover from current to upcoming session.

**Request Body**

```json
{
  "currentSession": {
    "start_year": 2024,
    "end_year": 2025,
    "sessionName": "Odd"
  },
  "upcomingSession": {
    "start_year": 2025,
    "end_year": 2026,
    "sessionName": "Even"
  }
}
```

**Major Operations (observed)**

1. Starts Mongo transaction
2. Locates current session and active sub-session
3. Archives graduating mentee history
4. Archives meeting pages into session records
5. Marks current year archived and upcoming year current
6. Promotes continuing mentees (`semester + 1`) to upcoming year/session
7. Bulk-updates mentor academic year/session
8. Commits transaction

**Success Response**

```json
{
  "message": "Session changed successfully",
  "stats": {
    "mentorsProcessed": 24,
    "graduatedMentees": 52,
    "continuingMentees": 480,
    "archivedMeetings": 130
  }
}
```

**Error Response**

```json
{ "error": "Error changing to upcoming session", "details": "..." }
```

---

### 6) Admin Meetings Listing

- **Endpoint:** `GET /api/admin/manageMeeting`
- **Purpose:** Paginated meeting retrieval for admin views.

**Query Params**

- Required: `year`, `session`, `semester`
- Optional: `page`, `limit`

**Success Response (shape)**

```json
{
  "meetings": [],
  "total": 0,
  "success": true
}
```

**Errors**

- `400`: missing required parameters
- `500`: fetch failure

---

### 7) Mentor Schedule Meeting

- **Endpoint:** `GET /api/meeting/mentors/schmeeting`
- **Purpose:** Retrieve mentor meetings by year/session/semester.

**Query Params**

- Required: `mentor_id`, `year`, `session`, `semester`

**Success Response (shape)**

```json
{ "meetings": [] }
```

- **Endpoint:** `POST /api/meeting/mentors/schmeeting`
- **Purpose:** Create scheduled meeting entry.

**Request Body (observed fields)**

```json
{
  "mentor_id": "MUJ00001",
  "meeting_id": "M-2026-0001",
  "year": "2025-2026",
  "session": "Even",
  "semester": "6",
  "meeting_date": "2026-02-15",
  "meeting_time": "10:30 AM",
  "TopicOfDiscussion": "Academic planning",
  "isMeetingOnline": true,
  "venue": "Google Meet"
}
```

**Errors**

- `400`: duplicate meeting / missing required query on GET
- `500`: persistence error

---

### 8) Manage Mentors (Admin)

- **Endpoint:** `GET /api/admin/manageUsers/manageMentor`
- **Purpose:** List/filter mentors.

**Query Params**

- Optional: `academicYear`, `academicSession`, `email`, `offset`

**Response Notes**

- Excludes sensitive fields: `password`, `otp`, `otpExpires`, `isOtpUsed`
- Returns `{ mentors, total }` or empty list payload

- **Endpoint:** `POST /api/admin/manageUsers/manageMentor`
  - Creates mentor record and conditionally admin record.
  - Auto-generates `MUJid` sequence (`MUJ00001` style).

- **Endpoint:** `PUT /api/admin/manageUsers/manageMentor`
  - Updates mentor and syncs admin collection based on role transitions.

- **Endpoint:** `PATCH /api/admin/manageUsers/manageMentor`
  - Partial update (phone/role/isActive).

- **Endpoint:** `DELETE /api/admin/manageUsers/manageMentor`
  - Removes selected roles or deletes mentor if no role remains.

---

### 9) Manage Mentees (Mentor API)

- **Endpoint:** `GET /api/mentor/manageMentee`
  - Query: `mentorEmail` (required)
  - Returns mentees assigned to mentor email

- **Endpoint:** `POST /api/mentor/manageMentee`
  - Body: **array of mentees**
  - Header: `mentor-mujid` required
  - Validates each item via Joi (mujid, name, email, guardian fields, DOB pattern, etc.)
  - `201` on success, `400` for validation failures, `500` on server errors

- **Endpoint:** `PATCH /api/mentor/manageMentee`
  - Body: `{ mujid, ...updateFields }`
  - Header: `mentor-mujid` required

- **Endpoint:** `DELETE /api/mentor/manageMentee`
  - Query: `mujid`
  - Header: `mentor-mujid` required

---

### 10) Generic Mentee API

- **Endpoint:** `GET /api/mentee`
  - Query filters: `year`, `term`, `semester`, `section`
  - Calls `Mentee.searchMentees(filters)`

- **Endpoint:** `POST /api/mentee`
  - Creates mentee document from body payload

- **Endpoint:** `PUT /api/mentee`
  - Body must include `mujid`, updates remaining fields

## Complete Endpoint Matrix

Comprehensive matrix for all route handlers (methods + query/body hints + status patterns).

### Admin

| Endpoint | Methods | Query Params (observed) | Body Fields (observed) | Statuses |
|---|---|---|---|---|
| `/api/admin/academicSession` | GET, POST | - | - | 200, 400, 409, 500 |
| `/api/admin/academicSession/archive` | PUT | - | `start_year`, `end_year` | 500 |
| `/api/admin/academicSession/changeCurrent` | PUT | - | `academicYear`, `sessionName` | 404, 500 |
| `/api/admin/academicSession/changeToUpcoming` | PUT | - | `currentSession`, `upcomingSession` | 500 |
| `/api/admin/assignMentor` | POST, PUT | - | - | 200, 201, 400, 500 |
| `/api/admin/assignMentor/bulk` | POST | - | - | 200, 400, 500 |
| `/api/admin/getMenteeMeetings` | GET | `menteeMujid` | - | 200, 400, 500 |
| `/api/admin/getMenteesByMentor` | GET | `mentorMujid`, `semester` | - | 200, 400, 500 |
| `/api/admin/getMenteesCount` | GET | `mentorMujid` | - | 400, 500 |
| `/api/admin/getMenteesForAssignment` | GET | `academicSession`, `academicYear`, `semester` | - | 200, 400, 500 |
| `/api/admin/manageMeeting` | GET | `year`, `session`, `semester`, `page`, `limit` | - | 400, 500 |
| `/api/admin/manageMeeting/meetingReport` | GET | `mentorMUJid`, `semester`, `session`, `year` | - | 400, 404, 500 |
| `/api/admin/manageUsers/assignMentor` | POST | - | - | 201 |
| `/api/admin/manageUsers/bulkUpload` | POST | - | - | 400, 500 |
| `/api/admin/manageUsers/checkMentorMentees` | GET | `mentorMujid` | - | 400, 500 |
| `/api/admin/manageUsers/editMentor/[mujid]` | GET, PATCH | - | - | 400, 404, 409, 500 |
| `/api/admin/manageUsers/getAllMentees` | GET | `academicSession`, `academicYear`, `semester` | - | 200, 401, 404, 500 |
| `/api/admin/manageUsers/getMentorMentees` | GET | `academicSession`, `academicYear`, `mentorMujid` | - | 400, 500 |
| `/api/admin/manageUsers/getNextMUJid` | GET | - | - | 500 |
| `/api/admin/manageUsers/manageAdmin` | DELETE, GET, PATCH, POST, PUT | - | - | 200, 201 |
| `/api/admin/manageUsers/manageAdmin/[MUJid]` | PATCH | - | - | 200, 400, 409, 500 |
| `/api/admin/manageUsers/manageMentee` | DELETE, GET, PATCH, POST, PUT | `academicSession`, `academicYear` | - | 200, 201, 400 |
| `/api/admin/manageUsers/manageMentor` | DELETE, GET, PATCH, POST, PUT | `academicSession`, `academicYear`, `email`, `offset`, `batchSize` | - | 200, 201, 400, 404, 409, 500 |
| `/api/admin/manageUsers/manageMentor/[MUJid]` | GET, PATCH | - | - | 400, 404, 409, 500 |
| `/api/admin/manageUsers/previewUpload` | POST | - | - | 400, 500 |
| `/api/admin/manageUsers/transferMentees` | POST | - | - | 400, 404, 500 |
| `/api/admin/mentorMeetings` | GET | `mentorId`, `semester`, `session`, `year` | - | 400, 404, 500 |
| `/api/admin/search` | GET | `mentorMujid`, `section`, `semester`, `term`, `year` | - | 200 |
| `/api/admin/send-email-mentor` | POST | - | - | 400, 500 |
| `/api/admin/settings/backdate-meeting` | GET, POST | - | - | 400, 500 |
| `/api/admin/unassignMentor` | POST | - | - | 200, 400, 404, 500 |

### Auth

| Endpoint | Methods | Query Params | Body Fields (observed) | Statuses |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | NextAuth managed | - | - | runtime-managed |
| `/api/auth/check-email` | POST | - | - | 200, 400, 404, 500 |
| `/api/auth/check-password` | POST | - | - | 400, 404, 500 |
| `/api/auth/create-password` | POST | - | - | 400, 404, 500 |
| `/api/auth/fetch-mujid` | POST | - | - | 200, 404 |
| `/api/auth/login-password` | POST | - | `email`, `password` | 400, 401, 404, 500 |
| `/api/auth/logout` | POST | - | - | 500 |
| `/api/auth/reset-password` | POST | - | `email`, `otp`, `password` | 400, 404, 500 |
| `/api/auth/send-otp` | POST | - | `email` | 200, 400, 500 |
| `/api/auth/verify-otp` | POST | - | `email`, `otp` | 400, 403, 404, 500 |

### Meeting / Meetings

| Endpoint | Methods | Query Params (observed) | Body Fields (observed) | Statuses |
|---|---|---|---|---|
| `/api/meeting` | POST | - | - | 500 |
| `/api/meeting/mentees` | GET | `mentorId`, `semester`, `session`, `year` | - | 200, 400, 500 |
| `/api/meeting/mentors/reportmeeting` | GET, POST | `mentor_id`, `section`, `semester`, `session`, `year` | `meeting_id`, `mentor_id`, `meeting_notes`, `presentMentees` | 200, 400, 404, 500 |
| `/api/meeting/mentors/schmeeting` | GET, POST | `mentor_id`, `semester`, `session`, `year` | scheduling fields (see contract) | 400, 500 |
| `/api/meeting/send-email` | POST | - | - | 400, 404, 500 |
| `/api/meetings/menteeDetails` | GET | `meetingId`, `mentorId`, `session`, `year` | - | 400, 500 |
| `/api/meetings/mentor` | GET | `mentorMUJid`, `semester`, `session`, `year` | - | 400, 500 |
| `/api/meetings/report` | GET | `mentorMUJid`, `section`, `semester`, `session`, `year` | - | 400, 404, 500 |

### Mentor / Mentee / Archive

| Endpoint | Methods | Query Params (observed) | Body Fields (observed) | Statuses |
|---|---|---|---|---|
| `/api/mentor` | GET, PUT | `MUJId`, `email` | - | 400, 401, 404, 500 |
| `/api/mentor/manageMeeting` | GET | `academicYear`, `mentorId`, `semester`, `session` | - | 200, 400, 500 |
| `/api/mentor/manageMentee` | DELETE, GET, PATCH, POST, PUT | `mentorEmail`, `mujid` | array/single mentee payloads | 200, 201, 400, 404, 500 |
| `/api/mentor/scheduleMeeting` | GET, POST | `mentor_id`, `semester`, `session`, `year` | - | 400, 500 |
| `/api/mentor/send-bulk-email` | POST | - | `emails`, `subject`, `body` | 400, 500 |
| `/api/mentor/send-email-parents` | POST | - | - | 400, 500 |
| `/api/mentee` | GET, POST, PUT | `section`, `semester`, `term`, `year` | create/update payload | 201, 500 |
| `/api/mentee/details` | GET | `MUJid` | - | 200 |
| `/api/mentee/meetings-attended` | POST, PUT | - | - | 200, 400, 404, 500 |
| `/api/archive/downloadReport` | GET | `academicSession`, `academicYear`, `downloadType` | - | 400, 404, 500 |
| `/api/archive/getMeetings` | GET | `academicSession`, `academicYear` | - | 400, 500 |
| `/api/archive/getMentees` | GET | `academicSession`, `academicYear` | - | 400, 500 |
| `/api/archive/getMentors` | GET | `academicSession`, `academicYear`, `page`, `pageSize` | - | 400, 500 |
| `/api/archive/getSessionData` | GET | `academicSession`, `academicYear` | - | 404, 500 |
| `/api/archive/getStats` | GET | `academicSession`, `academicYear` | - | 400, 500 |

## Integration Examples (cURL)

### OTP login sequence

```bash
# 1) Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor@example.edu"}'

# 2) Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor@example.edu","otp":"123456"}'
```

### Create academic session

```bash
curl -X POST http://localhost:3000/api/admin/academicSession \
  -H "Content-Type: application/json" \
  -d '{
    "start_year": 2025,
    "end_year": 2026,
    "sessions": [{"name": "Odd", "semesters": [{"semester_number": 5}]}]
  }'
```

### List admin meetings

```bash
curl "http://localhost:3000/api/admin/manageMeeting?year=2025-2026&session=Odd&semester=5&page=1&limit=20"
```

## Notes and Caveats

- This reference reflects implementation behavior in route handlers as of the current repository state.
- Some handlers use legacy field naming variants (`MUJid`, `mujid`, `mentor_id`, `mentorMujid`); preserve exact expected keys per endpoint.
- For endpoints with `Body Fields: -`, contract details may be implicit in internal model methods and can be expanded further route-by-route if needed.

## Maintenance Checklist

- Update this file whenever a route is added, removed, or renamed.
- Update method/query/body/status metadata when handler logic changes.
- Keep examples in sync with real payload keys to avoid integration drift.
