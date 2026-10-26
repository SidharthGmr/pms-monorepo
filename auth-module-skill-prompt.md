# Skill Prompt — Production Auth Module (JWT + Sessions + Refresh Rotation + RBAC Bootstrap)

> Use this file as the body of a `SKILL.md`. Suggested frontmatter:
>
> ```yaml
> ---
> name: auth-module-builder
> description: Scaffold the complete authentication module for a layered Node.js REST API — users + UserSession Prisma models, bcrypt password hashing, access/refresh JWT pair with typed claims and a server-side session table storing only SHA-256 digests, refresh-token rotation with reuse detection, and the full endpoint set (login, signup, refresh, logout, logout-all-sessions, email/OTP verification, forgot/reset password) with per-endpoint rate limiting — plus the exact login/refresh response contract a NextAuth frontend consumes. Use when the user wants to "add login/auth", "set up JWT auth", "add refresh tokens", "add forgot password / OTP", or "secure the API" in a new or existing project.
> ---
> ```

---

## THE PROMPT

You are building the **auth module** of a layered Node.js REST API (see the API skill for the layer/DI conventions — auth is just another resource: `authRoutes → AccountController → IUnitOfService.Account → AccountService → IUnitOfWork → repositories`, plus a dedicated `UserSessionService`). Security decisions below are the contract.

### 1. Data model

```prisma
model users {
  userId          String    @id            // UUID string — travels in JWTs; never expose the serial id
  email           String    @unique
  name            String
  password        String                   // bcrypt hash only — never plaintext, never selected into DTOs
  role            Role      @default(USER) // SUPER_ADMIN | ADMIN | STAFF | USER
  storeCode       String?                  // tenant assignment; null = not yet assigned
  emailVerifiedAt DateTime?
  // + status, timestamps per the schema skill
  sessions        UserSession[]
}

model UserSession {
  id               String    @id @default(uuid()) @db.Uuid    // this is the `sid` claim
  userId           String
  accessTokenHash  String    @unique @db.VarChar(255)         // SHA-256 digests ONLY —
  refreshTokenHash String?   @unique @db.VarChar(255)         //   a DB dump yields no usable credential
  ipAddress        String?   @db.VarChar(64)
  userAgent        String?
  expiresAt        DateTime                                   // = refresh token expiry
  revokedAt        DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  user users @relation(fields: [userId], references: [userId], onDelete: Cascade)
  @@index([userId, expiresAt])
  @@index([revokedAt])
}
```

### 2. Token utility (`utils/token.util.ts`)

- `hashToken(t) = sha256 hex` — the only form ever persisted.
- Every JWT carries: the identity claims (`userId, name, email, role, storeCode`), **`sid`** (session id), **`type`** (`'access'` | `'refresh'` — an access token can never be replayed as a refresh token and vice versa), and **`jti`** (random UUID, so two tokens signed in the same second don't collide on the unique hash columns).
- HS256, `JWT_SECRET` ≥ 32 chars, audience/issuer from env; access TTL ~`15m`, refresh ~`7d`.
- `verifySessionToken(token)` pins `algorithms: ['HS256']` and checks audience/issuer; `tokenExpiryDate(token)` decodes `exp` for the session row.
- Passwords: `bcrypt.hash(password, 10)` on signup/reset; `bcrypt.compare` on login. Same identical error for "no such user" and "wrong password".

### 3. Session service — issue, rotate, validate

**`issue(claims, context)`** (login): `sid = randomUUID()` → sign access + refresh with that `sid` → insert the session row with both hashes, ip/userAgent, `expiresAt = refresh expiry` → return `{ accessToken, refreshToken, expiries }`.

**`rotate(refreshToken, context)`** (the refresh endpoint — rotation with reuse detection):

1. `verifySessionToken` → must be `type === 'refresh'` with a `sid`; else 401.
2. Load the session by `sid`; reject if missing, `revokedAt` set, or expired.
3. **Reuse detection**: if `session.refreshTokenHash !== hashToken(presentedToken)`, an _old_ refresh token is being replayed — someone else already rotated it. **Revoke the whole session** and reject; the legitimate user logs in again, the thief is cut off.
4. Sign a fresh access+refresh pair on the same `sid`; overwrite both hashes and `expiresAt` in the session row. The old pair is now dead.

**`validateAccessToken(sid, accessToken)`** (called by `authenticateToken` on every request): the session must exist, be unrevoked/unexpired, and its `accessTokenHash` must match the presented token's digest — this is what makes **logout and revocation immediate** instead of waiting out the token TTL.

**`revoke(sid)`** / **`revokeAllForUser(userId)`**: set `revokedAt` — never delete rows; they are the audit trail.

### 4. Endpoints (`/auth`) with their rate limiters

| Route                                | Limiter                                                           | Behaviour                                                                                                                                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /login`                        | `authLimiter` (~10/15min)                                         | validate → bcrypt compare → `issue()` → return the contract in §5. Identical message for unknown email and wrong password.                                                                                                                  |
| `POST /signup`                       | `authLimiter`                                                     | validate (strong password rule in the shared Zod schema) → hash → create with `role: USER` — **the role is never accepted from the body** (the validate middleware strips it; the service ignores it anyway). Send a verification OTP/link. |
| `POST /refresh-token`                | `refreshLimiter` (~60/15min — routine traffic, offices share IPs) | body `{ token }` → `rotate()` → `{ newToken, refreshToken }`.                                                                                                                                                                               |
| `POST /logout`                       | — (authenticated)                                                 | revoke the caller's `sid`.                                                                                                                                                                                                                  |
| `POST /logout-all`                   | — (authenticated)                                                 | `revokeAllForUser` — "sign out everywhere".                                                                                                                                                                                                 |
| `POST /otp/send`, `POST /verify-otp` | `authLimiter`                                                     | email verification. OTP: 6 digits, short TTL, hashed at rest, single-use, attempts capped.                                                                                                                                                  |
| `POST /verify-token`                 | `authLimiter`                                                     | email-verification link variant (separate JWT `type`, short TTL).                                                                                                                                                                           |
| `POST /forgot-password`              | `authLimiter`                                                     | **Always respond 200 "if the account exists, an email was sent"** — never reveal whether an email is registered. The reset token is single-use, short TTL, its own `type`.                                                                  |
| `POST /reset-password`               | `authLimiter`                                                     | verify reset token → `bcrypt.hash(newPassword, 10)` → **`revokeAllForUser`** (a password change kills every live session).                                                                                                                  |

Every endpoint: `validate(schema)` from the shared types package, `asyncHandler`, the standard `CustomResponse` envelope, and **log auth events** (login success/failure, refresh reuse detected, password reset) with `requestId`/`userId` — never log tokens, passwords or OTPs (the logger redacts those keys as a backstop).

### 5. The response contract the frontend depends on

The NextAuth credentials provider consumes exactly this — change it and login breaks silently:

```jsonc
// POST /auth/login →
{ "success": true, "message": "...", "data": { "user": {
    "userId": "...", "name": "...", "email": "...", "role": "ADMIN", "storeCode": "MAIN",
    "token": "<access JWT>",            // frontend decodes its `exp` for refresh scheduling
    "refreshToken": "<refresh JWT>"     // lives ONLY in the encrypted NextAuth cookie
}}}

// POST /auth/refresh-token →
{ "success": true, "data": { "newToken": "<access JWT>", "refreshToken": "<rotated refresh JWT>" } }
```

Because the API **rotates** the refresh token on every use, the frontend must have exactly **one** refresher (NextAuth's `jwt` callback) — a second concurrent refresher presents the old token, trips reuse detection, and signs the user out. Document this in both codebases.

### 6. RBAC wiring (recap — details in the API skill)

- `authenticateToken` populates `req.user` from claims after `validateAccessToken`; `authorization([roles])` re-fetches the user from the DB so demotion/deletion takes effect immediately.
- Role changes and tenant reassignment are **admin endpoints** (`SUPER_ADMIN` managing `ADMIN`s, etc.) — never self-service, never mass-assignable through profile updates.
- The first `SUPER_ADMIN` comes from the **seed script** (schema skill), credentials via env — there is no "register as admin" endpoint.

### 7. Email delivery

Verification/reset mail goes through one `EmailService` behind an interface (SMTP or an API provider), with templates kept server-side. Links are built from `NEXT_PUBLIC_APP_NAME` (env-validated, required in production) — never from the request's `Host` header, which an attacker controls (password-reset poisoning).

### 8. Definition of done

1. Signup → verify → login → authenticated call → refresh (token actually rotates — compare strings) → logout → the old access token now 401s _immediately_.
2. Replaying a used refresh token revokes the session (reuse detection fires); password reset kills all sessions.
3. Wrong password, unknown email and unverified account produce non-enumerating messages; `forgot-password` returns 200 either way.
4. Rate limits verified on login and refresh; role cannot be set via signup or profile-update bodies (Zod strips it — test it).
5. The seeded SUPER_ADMIN logs in on a fresh database; the NextAuth frontend completes the full login → silent-refresh → forced-logout cycle against these endpoints.
