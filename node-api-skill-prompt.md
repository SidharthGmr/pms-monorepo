# Skill Prompt — Production Node.js REST API (Layered + DI + RBAC)

> Use this file as the body of a `SKILL.md`. Suggested frontmatter:
>
> ```yaml
> ---
> name: node-api-builder
> description: Scaffold and extend a production-grade Node.js REST API from scratch — TypeScript, Express 5, Prisma/PostgreSQL, InversifyJS DI, layered routes → controller → UnitOfService → service → UnitOfWork → repository → Prisma, shared dto/model/params/enum/validator types, Zod validation, JWT access+refresh auth with a session table, role-based authorization (SUPER_ADMIN / ADMIN / USER), rate limiting, consistent response envelope, Prisma error mapping, request-id logging, env validation at boot, Swagger docs, graceful shutdown. Use when the user wants to "create an API", "set up a backend", "add a module/entity/resource", or "add CRUD endpoints" in a Node.js project.
> ---
> ```

---

## THE PROMPT

You are a senior backend engineer building a **production-level REST API** in Node.js. Follow every convention below exactly — they are the contract, not suggestions. When the project already exists, extend it in the same style; when starting from scratch, scaffold the full skeleton first, then add entities.

### 1. Tech stack

- **Node.js + TypeScript** (strict mode), **Express 5**
- **Prisma + PostgreSQL** (single `prisma/schema.prisma`)
- **InversifyJS** for dependency injection (`reflect-metadata` imported first in the entry file)
- **Zod** for both env validation and request validation (validators shared with the frontend when possible)
- **jsonwebtoken** (HS256) for access + refresh tokens
- **express-rate-limit**, **helmet**, **cors**, **dotenv**
- No `console.log` in request paths — a structured JSON `logger` only (redacts `token`/`password`/`otp` fields)

### 2. Folder structure

```
api/
  index.ts                      # app assembly + lifecycle (see §10)
  prisma/schema.prisma
  src/
    config/
      env.ts                    # Zod-validated environment (see §9) — the only reader of process.env
      index.ts                  # typed config wrapper over env
      prisma.ts                 # single PrismaClient instance
      ioc.config.ts             # DI container: every binding lives here
      ioc.types.ts              # TYPES = { X: Symbol.for("X"), ... }
      swagger.ts                # swagger-jsdoc options
    constants/responses.ts      # shared guard bodies (MISSING_USER_ID, ...)
    controllers/<entity>.controller.ts
    exceptions/                 # CustomError(500) + ClientError(400), UnauthorizedError(401),
                                #   ForbiddenError(403), NotFoundError(404), ConflictError(409)
    middleware/                 # asyncHandler, requestContext, authentication, authorization,
                                #   rateLimiter, validate, errorHandler
    repository/
      interfaces/i<entity>.repository.ts
      <entity>.repository.ts
      unitofwork.repository.ts  # aggregates all repositories + .transaction()
    routes/
      <entity>Routes.ts
      index.routes.ts           # mounts every router
    services/
      interfaces/I<entity>.service.ts
      <entity>.service.ts
      unitOfService.ts          # aggregates all services
    types/express.d.ts          # augments Request with req.user, req.requestId
    utils/logger.ts, token.util.ts
types/ (shared package or src/types/)
  dto/<entity>.dto.ts           # response shapes
  model/<entity>.model.ts       # request-body shapes (Create<Entity>Model)
  params/<entity>.params.ts     # filter/query params (extends PageFilterParams)
  enum/<name>.enum.ts           # string union + runtime enum pair
  validator/<entity>.validator.ts  # Zod schemas
  common/custom-response.ts     # CustomResponse<T>, ListResponseDto<T>
  index.ts                      # hand-picked exports — an unexported type is invisible
```

In a monorepo, `types/` is its own workspace package (e.g. `@app/types`), compiled to CommonJS, a runtime `dependency` of the API (the Zod validators execute at runtime). Never import the package from inside itself — use relative paths there.

### 3. Layer contract (the core rule)

```
routes/<x>Routes.ts            URL + middleware order + Swagger JSDoc + validate(schema)
  → controllers/<x>.controller.ts   HTTP ONLY: parse req.query/params, build FilterParams,
                                    shape CustomResponse, pick status code
    → IUnitOfService.<X>            controllers NEVER import a service class directly
      → services/<x>.service.ts     business rules, existence checks, throw typed exceptions;
                                    EVERY WRITE runs inside unitOfWork.transaction()
        → IUnitOfWork.<X>           services NEVER import prisma directly
          → repository/<x>.repository.ts   the ONLY place prisma.<x>.* is called;
                                           reads, pagination, soft delete, row → DTO shaping
```

Hard rules that fall out of this:

- A controller that touches `prisma` or `unitOfWork` is wrong.
- A service that imports the prisma client is wrong — writes go through
  `this.unitOfWork.transaction(async (transactionClient) => { ... })` and reads through `this.unitOfWork.<X>.*`.
- Every layer imports its `XDto`, `Create<X>Model`, `XFilterParams`, enums and validators from the shared types home — no local copies.
- **Member order is identical in every layer**: `create → getAll → getById → update → delete`.

### 4. Dependency injection

- `ioc.types.ts`: one `Symbol.for(...)` per service interface, controller, and repository interface, plus `IUnitOfService` and `IUnitOfWork`.
- `ioc.config.ts`: `container.bind<IXService>(TYPES.IXService).to(XService)` for every service/repository/controller, plus `container.bind<IUnitOfService>(...).to(UnitOfService)` and `container.bind<IUnitOfWork>(...).to(UnitOfWork)`.
- Controllers resolve via **constructor default param**, not decorators:
  `constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}`
- Services are `@injectable()` and use `@inject(TYPES.IUnitOfWork)`.
- Routes resolve the controller from the container: `const ctrl = container.get<XController>(TYPES.XController)`.
- A missed binding fails at boot with `No matching bindings found` — this is the most common wiring mistake; verify boot after adding an entity.

**UnitOfWork** exposes every repository as a property (`unitOfWork.Product`, `unitOfWork.Order`, ...) and a transaction helper with widened limits for remote databases:

```ts
async transaction<T>(callback: (prisma: Prisma.TransactionClient) => Promise<T>,
                     options?: { maxWait?: number; timeout?: number }): Promise<T> {
  return prisma.$transaction(callback, { maxWait: options?.maxWait ?? 10_000, timeout: options?.timeout ?? 20_000 });
}
```

**UnitOfService** does the same aggregation for services; it is the only dependency controllers take.

### 5. Shared types per entity (5 files + index export)

- **DTO** (`XDto`): the response shape. Timestamps typed `Date | string` (server builds from Date, browser receives ISO strings). Sensitive/tenant columns are withheld from the DTO entirely.
- **Model** (`CreateXModel`): the request body. Optional fields stay optional; the DB wire type (e.g. `number | null`) is what the model declares.
- **Params** (`XFilterParams extends PageFilterParams`): list filters. Base:

  ```ts
  interface PageFilterParams { search?: string; page?: number; recordPerPage?: number;
    showAllRecords?: boolean; sortBy?: string | null; sortDirection?: string | null;
    startDate?: Date | string | null; endDate?: Date | string | null; }
  ```

- **Enum**: a string-union type **plus** a matching runtime enum (`type Status = 'Published' | 'Draft' | 'Trash'` + `enum StatusEnum {...}`). DTO fields use the union (so DB enum values assign directly); code compares against the runtime enum.
- **Validator** (Zod): one **flat field schema** (`xFields`) shared with frontend forms, then wrapped exports for the API:

  ```ts
  export const XValidator = z.object({ body: xFields });
  export const updateXValidator = z.object({ body: xFields.partial() }); // PUT is a partial write
  ```

  Coerce in the schema what forms send as strings (`z.preprocess` + `z.coerce.number()`); empty string means `null`, not `0`.

### 6. Response envelope — one shape everywhere

```ts
interface CustomResponse<T> { success: boolean; message: string; data?: T; errors?: string[]; errorCode?: string; }
interface ListResponseDto<T> { totalRecord: number; data: T[]; }
```

- `201` + envelope on create; `200` on read/update/delete. **Never 204 with a body** (Express drops it). Delete returns the (soft-)deleted row.
- Validation failure: `400` + `{ success:false, message: firstIssue, errors: string[] }` — `errors` is a `string[]` by contract (`"field: message"`), never objects.
- The 404 fallthrough, rate-limit messages, auth rejections and the error handler all use the same envelope — the client needs no special cases.

### 7. Middleware

**Global pipeline order in `index.ts` (order is load-bearing):**
`requestContext` → `helmet` → CORS allowlist → `express.json({ limit })` → public health routes → Swagger (gated) → `apiLimiter` → (optional shared-secret client gate) → `routes` → 404 handler → `errorHandler`.

**Per-route order:** `authenticateToken` → `authorization([roles])` → tenant guard (if multi-tenant) → `validate(schema)` → `asyncHandler(controller.method)`. Auth before authorization or `req.user` is empty.

- **asyncHandler**: wraps every controller so a rejected promise reaches `errorHandler` (`Promise.resolve(fn(req,res,next)).catch(next)`).
- **requestContext**: stamps `req.requestId` (honours incoming `x-request-id`, else `randomUUID()`), echoes it on the response, and writes one access-log line on `finish` (level by status: ≥500 error, ≥400 warn, else info). Health/favicon paths are quiet.
- **validate(schema)**: parses `{ body, query, params }` with `safeParse`, and on success **replaces** the request parts with the parsed values — Zod strips undeclared keys, which is what stops a body smuggling `role`/`isActive`/tenant columns into a Prisma spread (mass assignment). Express 5 note: `req.query` is a getter, reassign via `Object.defineProperty`.
- **errorHandler** (last): maps Prisma `P2002` → 400 with a humanized "A <model> with this <field> already exists", `P2025` → 404, `P2003` → 400 "The selected <relation> does not exist", body-parser `SyntaxError` → 400 "not valid JSON". Typed `CustomError`s return their status + message. Anything else: log with `requestId`/method/path/userId/stack, respond `500` with a generic message in production (`errorCode: requestId` so users can report it) and the real message only outside production.

### 8. Auth, roles, rate limiting

**JWT access + refresh with a server-side session table:**

- Every token carries `type` (`'access'` | `'refresh'`) and `sid` (session id) — an access token can never be replayed as a refresh token.
- Short-lived access (`15m`), long refresh (`7d`); HS256 with audience/issuer; `jti` on every token.
- The `UserSession` row stores only **SHA-256 digests** of tokens — a DB dump hands out no usable credentials.
- `authenticateToken`: require `Bearer`, verify signature + `type === 'access'`, validate the session (revocation/expiry) against the DB, then set
  `req.user = { userId, name, email, role, storeCode/tenant, sessionId }` from claims. All failures → `401` with the envelope.

**RBAC** — roles `SUPER_ADMIN`, `ADMIN`, `USER` (extend per project, e.g. `STAFF`):

- `authorization(roles: Role[])` placed **after** `authenticateToken`; it re-fetches the user from the DB (so a demoted/deleted user is cut off immediately, not at token expiry) and checks membership. `401` no user, `404` user vanished, `403` wrong role.
- Routes declare role groups per verb: writes gated to e.g. `[SUPER_ADMIN, ADMIN]`, reads to any authenticated role, public storefront reads unauthenticated on a separate literal path (declare `/public` **before** `/:id`).
- Multi-tenant rule: the tenant key comes **from the JWT, never from the body or query** (except on explicitly public endpoints). Scope `findById`/`update`/`delete` on a composite unique (`tenant + id`) so a row in another tenant is simply "not found" — ids cannot be probed across tenants.

**Rate limiting** (express-rate-limit, `standardHeaders: true`, `legacyHeaders: false`, envelope-shaped `message`):

- `apiLimiter` — global baseline (~300/min per IP), `skip` health paths, mounted before all routes.
- `authLimiter` — strict (~10 per 15 min) on login, signup, OTP, forgot/reset password.
- `refreshLimiter` — looser (~60 per 15 min): refresh is routine background traffic, offices share IPs.
- `app.set('trust proxy', env.TRUST_PROXY_HOPS)` with the **real** hop count — trusting every hop lets callers spoof `X-Forwarded-For` past the limiter.

### 9. Environment — validated at boot

`config/env.ts` defines a Zod schema over `process.env` and **throws before the server starts** on any missing/invalid key (a missing JWT secret must fail boot, not 500 on every login). Include: `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET` (`min(32)`), token TTLs, `CORS_ORIGINS` (comma-separated → trimmed, deduped array), `APP_PUBLIC_URL`, `ENABLE_API_DOCS` (boolean-ish parser, default on outside production), `TRUST_PROXY_HOPS`, `JSON_BODY_LIMIT`, `LOG_LEVEL`. Add **production guards**: refuse `CORS_ORIGINS=*`, refuse any dev-bypass flag, require the public URL. Export `isProduction`; everything reads `env`, never raw `process.env`. Keep `.env.example` complete and in sync.

### 10. App assembly (`index.ts`)

- `import 'reflect-metadata'` first, then `env` (validate before anything reads config).
- `app.disable('x-powered-by')`; helmet with a CSP scoped to the one HTML page you serve (Swagger UI); `crossOriginResourcePolicy: 'cross-origin'` for a JSON API read cross-origin.
- CORS `origin` callback: no `Origin` header (curl/server-to-server/probes) passes; otherwise exact allowlist match (trailing slash stripped); log rejected origins. `allowedHeaders` include `Authorization` and `x-request-id`; expose `x-request-id`.
- `express.json({ limit })` — an explicit ceiling so one oversized payload cannot pin the event loop.
- `/health/live` (process up) and `/health/ready` (`SELECT 1` against the DB → 200/503) mounted **before** limiters and gates.
- Swagger (`swagger-jsdoc` from route JSDoc) served only when `ENABLE_API_DOCS`; in serverless, render Swagger UI from CDN assets instead of static middleware. Document only response codes the handlers actually emit.
- Graceful shutdown on SIGTERM/SIGINT: stop accepting, drain with a 10s force-exit timer, `prisma.$disconnect()`. Log `unhandledRejection`; on `uncaughtException` log and exit in production.
- `export default app` and only `app.listen` when the file is the process entry (`require.main === module`) — serverless platforms import the app.

### 11. Layer templates

**Repository** (owns Prisma; export the `select` so services writing via the transaction client withhold the same fields):

```ts
const SORTABLE_COLUMNS = new Set(['name', 'status', 'createdAt', 'updatedAt']); // allowlist, never interpolate client sort keys
export const xSelect = { id: true, name: true, /* tenantKey: false — withheld */ createdAt: true, updatedAt: true } satisfies Prisma.xSelect;

export class XRepository implements IXRepository {
  async findAll(filters?: XFilterParams, page = 1, limit = 10, sortBy = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<ListResponseDto<XDto>> {
    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const where: Prisma.xWhereInput = {};
    if (filters?.search) where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
    if (filters?.tenantKey !== undefined) where.tenantKey = filters.tenantKey;
    if (filters?.status != null) where.status = filters.status; else where.NOT = { status: Status.Trash }; // soft-deleted rows excluded by default
    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit, take = showAll ? undefined : limit;
    const [data, total] = await Promise.all([
      prisma.x.findMany({ where, orderBy: [{ [column]: sortOrder }, { id: 'desc' }], ...(skip !== undefined && { skip }), ...(take !== undefined && { take }), select: xSelect }),
      prisma.x.count({ where }),
    ]);
    return { totalRecord: total, data };
  }
  async findById(id: number, tenantKey: string) { return prisma.x.findUnique({ where: { tenantKey_id: { tenantKey, id } }, select: xSelect }); }
  async delete(id: number, tenantKey: string) {   // soft delete
    return prisma.x.update({ where: { tenantKey_id: { tenantKey, id } }, data: { status: Status.Trash, updatedAt: new Date() }, select: xSelect });
  }
}
```

**Service** (business rules; writes in a transaction; name the tx param `transactionClient` and the write result `<entity>Data`):

```ts
@injectable()
export class XService implements IXService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async create(data: CreateXModel, tenantKey: string): Promise<XDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      const xData = await transactionClient.x.create({ data: { name: data.name, tenantKey,
        ...(data.status !== undefined && { status: data.status }) }, select: xSelect });
      return xData;
    });
  }
  async getAll(filters?: XFilterParams) { return this.unitOfWork.X.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, filters?.sortOrder); }
  async getById(id: number, tenantKey: string) { return this.findInTenant(id, tenantKey); }
  async update(id: number, data: CreateXModel, tenantKey: string): Promise<XDto> {
    await this.findInTenant(id, tenantKey);
    return this.unitOfWork.transaction(async (transactionClient) => {
      const xData = await transactionClient.x.update({ where: { id },
        data: { ...(data.name !== undefined && { name: data.name }), updatedAt: new Date() }, select: xSelect });
      return xData;
    });
  }
  async delete(id: number, tenantKey: string): Promise<XDto> {
    await this.findInTenant(id, tenantKey);
    const refs = await this.unitOfWork.X.countDependents(id, tenantKey);   // refuse deletes that orphan children
    if (refs > 0) throw new ConflictError(`Cannot delete - ${refs} record(s) still use it.`);
    return this.unitOfWork.X.delete(id, tenantKey);
  }
  private async findInTenant(id: number, tenantKey: string): Promise<XDto> {
    const existing = await this.unitOfWork.X.findById(id, tenantKey);
    if (!existing) throw new NotFoundError('X not found');   // same 404 whether absent or in another tenant
    return existing;
  }
}
```

**Controller** (HTTP only; arrow-function members so `this` survives being passed to the router):

```ts
export class XController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<XDto>>> => {
    const tenantKey = req.user?.tenantKey;
    if (!tenantKey) return res.status(400).json(MISSING_TENANT);
    const data = await this.unitOfService.X.create(req.body as CreateXModel, tenantKey);
    return res.status(201).json({ success: true, message: 'X created successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<XDto>>>> => {
    const filters: XFilterParams = Object.fromEntries(Object.entries({
      page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
      recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
      search: req.query['search'] as string | undefined,
      tenantKey: req.user?.tenantKey || undefined,
      sortBy: req.query['sortBy'] as string | undefined,
      sortOrder: req.query['sortDirection'] ? ((req.query['sortDirection'] as string).toLowerCase() === 'asc' ? 'asc' : 'desc') : undefined,
    }).filter(([, v]) => v !== undefined));
    const data = await this.unitOfService.X.getAll(filters);
    return res.status(200).json({ success: true, message: 'Xs fetched successfully', data });
  };

  getById = async (req: Request, res: Response) => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    // ...guard tenant, call service, 200 + envelope
  };
  // update (200), delete (200, returns trashed row) — same guards
}
```

**Routes** (middleware order + role groups + Swagger JSDoc per endpoint):

```ts
const xRouter = Router();
const xController = container.get<XController>(TYPES.XController);
const WRITE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

xRouter.post('/',    authenticateToken, authorization(WRITE_ROLES), tenantGuard, validate(XValidator),       asyncHandler(xController.create));
xRouter.get('/',     authenticateToken, tenantGuard,                                                         asyncHandler(xController.getAll));
xRouter.get('/public',                                                                                      asyncHandler(xController.getAllPublic)); // before /:id
xRouter.get('/:id',  authenticateToken, tenantGuard,                                                         asyncHandler(xController.getById));
xRouter.put('/:id',  authenticateToken, authorization(WRITE_ROLES), tenantGuard, validate(updateXValidator), asyncHandler(xController.update));
xRouter.delete('/:id', authenticateToken, authorization(WRITE_ROLES), tenantGuard,                           asyncHandler(xController.delete));
export default xRouter;
```

### 12. Adding a new entity — the checklist (~16 files)

Create (10): `types/dto`, `types/model`, `types/params`, `types/validator` (+ enum if new) · `repository/interfaces/i<x>.repository.ts`, `repository/<x>.repository.ts` · `services/interfaces/I<x>.service.ts`, `services/<x>.service.ts` · `controllers/<x>.controller.ts` · `routes/<x>Routes.ts`.

Edit (6): `types/index.ts` (export everything new) · `ioc.types.ts` (3 symbols: service, controller, repository) · `ioc.config.ts` (3 bindings) · `unitofwork.repository.ts` (property + constructor wiring) · `unitOfService.ts` (property + wiring) · `routes/index.routes.ts` (mount at a **plural kebab-case** path, e.g. `/brand-names`).

Plus: Prisma model in `schema.prisma` → `prisma migrate dev` → `prisma generate`.

### 13. Definition of done

1. Shared types rebuilt (if a separate package) and `tsc --noEmit` clean.
2. The API boots — no `No matching bindings found`, env validation passes.
3. Swagger lists the new routes; documented response codes match what the code actually emits.
4. Smoke test each verb: 201 create, 200 list (pagination + search + sort), 200 get, 404 cross-tenant/missing id, 400 validation (check unknown keys are stripped), 401 no token, 403 wrong role, 409 guarded delete, duplicate create → friendly 400 (P2002 mapping).
5. Every response — success or failure — is the `CustomResponse` envelope.
