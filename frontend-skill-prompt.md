# Skill Prompt — Production Next.js Frontend (Shared Types + DI Services + Role-wise Auth)

> Use this file as the body of a `SKILL.md`. Suggested frontmatter:
>
> ```yaml
> ---
> name: nextjs-frontend-builder
> description: Scaffold and extend a production Next.js (App Router) frontend that pairs with a layered Node.js REST API — NextAuth credentials login against the API with silent JWT refresh, role-wise route protection middleware (SUPER_ADMIN / ADMIN / USER), an InversifyJS service layer (HttpService + I<X>Service + UnitOfService) mirroring the backend, React Query hooks per entity, react-hook-form forms driven by the SAME shared Zod validators / DTOs / models / params the backend uses, Redux Toolkit for client state, shadcn/ui components, centralized env config, and server-route secret hygiene. Use when the user wants to "create a frontend", "set up Next.js", "wire the UI for an API", "add a login with roles", "add a form/listing page for an entity", or "call the backend from React".
> ---
> ```

---

## THE PROMPT

You are a senior frontend engineer building a **production Next.js frontend** for a layered REST API. The frontend mirrors the backend's architecture: the same shared types package, the same DI/UnitOfService pattern, one service method per endpoint, and hooks on top. Components never call axios directly.

### 1. Tech stack

- **Next.js 14+ App Router** + TypeScript (strict)
- **NextAuth** (Credentials provider, JWT session strategy) for login/session/refresh
- **InversifyJS** for the service layer (mirrors the backend container)
- **axios** wrapped in one `HttpService` — the only file that creates axios instances
- **@tanstack/react-query** for server state; **Redux Toolkit** for client/UI state
- **react-hook-form + zodResolver** with the **shared** Zod validators from the types package
- **shadcn/ui + Radix + Tailwind** for components
- Shared types package (`@<scope>/types`): every `XDto`, `Create<X>Model`, `XFilterParams`, enum and validator is imported from there — **never redeclared locally**

### 2. Folder structure

```
apps/web/src/
  app/
    (auth)/login, sign-up, recover-password/   # own layout, no shell chrome
    (pages)/...                                # public pages
    admin/<entities>/                          # ADMIN + SUPER_ADMIN back-office
    superadmin/...                             # SUPER_ADMIN only
    dashboard/...                              # USER/STAFF area
    api/auth/[...nextauth]/options.ts, route.ts
    api/<server-things>/route.ts               # anything touching a server secret
  middleware.ts                                # role-wise route protection (see §5)
  components/{ui,common,layout,admin,features} # shadcn/ui configured via components.json
  config/
    index.ts                                   # ALL env-driven values (see §3)
    ioc.ts                                     # DI container
    types.ts                                   # TYPES symbols
  services/
    HttpService.ts                             # the axios wrapper (see §6)
    ErrorHandlerService.ts                     # envelope → user message
    <Entity>Service.ts                         # one per backend resource
    UnitOfService.ts                           # aggregates all services
    interfaces/I<Entity>Service.ts, IHttpService.ts, IUnitOfService.ts
  hooks/
    service-hooks/use<Entity>Service.ts        # React Query hooks per entity (see §8)
    use-*.ts                                   # UI hooks (pagination, modal, role redirect, ...)
  lib/store.ts, hooks.ts                       # Redux store + typed useAppDispatch/useAppSelector
  providers/ReactQueryProvider.tsx, ReduxStoreProvider.tsx
  utils/, types/                               # app-only helpers; framework-coupled types only
```

### 3. Config — one reader of `process.env`

`src/config/index.ts` exports a single object (`apiBaseUrl`, `clientId`, `appName`, `appUrl`, `cdnUrl`, `recordPerPage`, `isProduction`, ...). Components and services import this, never `process.env`. Only `NEXT_PUBLIC_*` values are client-safe (Next.js inlines them at build time); **secrets (`NEXTAUTH_SECRET`, signing keys, API secrets) must never get the `NEXT_PUBLIC_` prefix**. Strip trailing slashes from URLs once, here. Keep `.env.example` complete.

### 4. Auth — NextAuth credentials against the API

`app/api/auth/[...nextauth]/options.ts`:

- **Credentials provider `authorize()`** POSTs to the API's `/auth/login` (with the `clientId` header). On failure **throw** `new Error(apiMessage)` rather than returning `null` — NextAuth carries the thrown message back to `signIn()`, while `null` collapses everything to "CredentialsSignin". Distinguish "cannot reach the server" (no `error.response`) from bad credentials.
- **`jwt` callback** — the only place the refresh token is ever spent:
  1. *Initial sign-in*: merge the API user into the token; decode the access JWT's payload to store `accessTokenExpires = exp * 1000`.
  2. *Still valid*: return the token while `Date.now() < accessTokenExpires - SKEW` (≈2 min skew so a pre-emptive caller doesn't get an already-dying token).
  3. *Expiring*: POST the refresh token to `/auth/refresh-token`, store the new pair + new decoded expiry. The API rotates refresh tokens, so a second refresher anywhere else would revoke the session. On failure set `token.error = 'RefreshAccessTokenError'`.
- **`session` callback**: expose the token as `session.user` but **strip the refresh token** — it stays in the encrypted NextAuth cookie; the browser only ever needs the short-lived access token. Pass `token.error` through so the client can force logout.
- `session: { strategy: 'jwt' }`; secret from `NEXTAUTH_SECRET`.

After login, redirect **by role** (a `useRoleBasedRedirection` hook): SUPER_ADMIN → `/superadmin`, ADMIN → `/admin`, USER/STAFF → `/dashboard`.

### 5. Role-wise route protection — `src/middleware.ts`

```ts
export default withAuth(function middleware(req) {
  const pageUrl = req.nextUrl.pathname.toLowerCase();
  const role = (req.nextauth.token?.role || '') as string;

  // EXACT role matches only — a substring check lets any role that contains
  // another (SUPER_ADMIN contains ADMIN) inherit its pages.
  const accessControlMap: Record<string, Roles[]> = {
    '/superadmin/': [Roles.SUPER_ADMIN],
    '/admin/':      [Roles.ADMIN, Roles.SUPER_ADMIN],
    '/dashboard/':  [Roles.USER, Roles.STAFF],
  };

  for (const [prefix, requiredRoles] of Object.entries(accessControlMap)) {
    if (pageUrl.startsWith(prefix) && !requiredRoles.some((r) => r === role)) {
      const url = new URL('/access-denied', req.url);
      url.searchParams.set('fromMiddleware', 'true');
      return NextResponse.redirect(url);
    }
  }
}, { callbacks: { authorized: ({ token }) => !!token } });

export const config = { matcher: ['/admin/:path*', '/superadmin/:path*', '/dashboard/:path*', '/access-denied'] };
```

- `authorized: !!token` sends anonymous visitors to the login page; the function body handles *wrong role* → `/access-denied`.
- Guard `/access-denied` itself (require the `fromMiddleware` marker) so direct visits 404 instead of looking like a real page.
- Middleware is **UX-level** protection only — the API's own `authorization([roles])` middleware is the security boundary. Never trust the client role for anything but navigation.

### 6. `HttpService` — the only axios factory

```ts
@injectable()
export default class HttpService implements IHttpService {
  // Unauthenticated endpoints (login, signup, refresh): clientId header, no bearer,
  // no 401 interceptor — a 401 here is a real answer, not an expired session.
  externalCall(contentType = 'application/json'): AxiosInstance { ... }

  call(contentType = 'application/json'): AxiosInstance {
    const instance = axios.create({
      baseURL: config.apiBaseUrl,
      headers: { clientId: config.clientId, 'Content-Type': contentType },
      validateStatus: (status) => status < 500,   // 4xx resolves — callers read the envelope
    });
    // Bearer token from localStorage['at'] (client only).
    // FULFILLED interceptor (not rejected — validateStatus resolves 401s!):
    //   on 401 && !originalRequest._retry:
    //     1. mark _retry; call getSession() — this forces NextAuth's jwt callback,
    //        which silently refreshes the access token
    //     2. session.error === 'RefreshAccessTokenError' → clear 'at', signOut(), give up
    //     3. store the new token in localStorage + headers, retry the original request ONCE
    // Rejected branch only ever sees 5xx and network errors — just reject.
    return instance;
  }
}
```

Key decisions worth copying:
- `validateStatus < 500` means business errors (400/401/403/404/409) arrive as **responses** with the `CustomResponse` envelope — components check `response.status` / `response.data.success` instead of try/catch.
- The 401-refresh logic must live in the **fulfilled** interceptor branch for exactly that reason.
- Do not blanket-redirect on 403 — "wrong role" and "no tenant assigned" both arrive as 403; let the caller present it.

### 7. Service layer — the backend's DI mirror

- `config/types.ts`: `TYPES = { IHttpService: Symbol.for(...), I<X>Service: ..., IUnitOfService: ... }`.
- `config/ioc.ts`: `import 'reflect-metadata'` first; bind every `I<X>Service` → implementation, plus `HttpService`, `ErrorHandlerService`, `UnitOfService`.
- One `<X>Service` per backend resource, `@injectable()`, taking `httpService = container.get<IHttpService>(TYPES.IHttpService)` as a constructor default. **One method per endpoint**, typed end-to-end with the shared types:

```ts
create(model: CreateXModel): Promise<AxiosResponse<CustomResponse<XDto>>> {
  return this.httpService.call().post('/xs', model);
}
getAll(params?: XFilterParams): Promise<AxiosResponse<CustomResponse<ListResponseDto<XDto>>>> {
  return this.httpService.call().get('/xs', { params });
}
// getById, update, delete — same order as the backend: create → getAll → getById → update → delete
```

- `UnitOfService` aggregates them (`unitOfService.XService`), exposed via `IUnitOfService` — **the only service type components/hooks ever resolve**.
- `ErrorHandlerService.getErrorMessage(response)` turns the envelope into a display string: join `errors[]`, else `message`, else a generic production fallback. Every toast goes through it.

### 8. API hooks — React Query per entity (`hooks/service-hooks/use<X>Service.ts`)

```ts
const useGetAllXs = (params?: XFilterParams, enabled = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  return useQuery({ queryKey: ['XService.getAll', params], queryFn: () => unitOfService.XService.getAll(params), enabled });
};

const useGetXById = (id: number | string, enabled = true) =>
  useQuery({ queryKey: ['XService.getById', id], queryFn: () => unitOfService.XService.getById(id), enabled: enabled && !!id });

const useCreateX = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model: CreateXModel) => unitOfService.XService.create(model),
    onSettled: (response) => {
      if (response && response.status === 201)             // 200 for update/delete
        queryClient.invalidateQueries({ queryKey: ['XService.getAll'] });
    },
  });
};
```

Conventions: queryKey = `'<Service>.<method>'` + its params (so any param change refetches and invalidation by prefix catches every filter combination); mutations invalidate the list key **only on a success status** (remember: 4xx resolves); `enabled` guards gate id-dependent queries. Components consume these hooks, never services directly — the chain is `component → hook → UnitOfService → XService → HttpService`.

### 9. Forms — the shared validator is the single source of truth

- Forms use **the flat field schema** (`xFields`) from the shared types package with `zodResolver` — react-hook-form hands the resolver flat values, so the API's `{ body: ... }`-wrapped schema can never match. Same rules on both ends, one source of truth: a max-length or coercion rule changed in the package updates the form *and* the API in one edit.
- The form value type is `z.infer<typeof xFields>`; the submit payload is `Create<X>Model`.
- Standard add/edit pattern: a `Manage<X>` dialog (shadcn `Dialog` + `Form`) that takes an optional existing `XDto`; on submit calls `useCreateX`/`useUpdateX`, reads failures through `ErrorHandlerService`, resets and closes on success (list refreshes via invalidation). The listing page pairs it with a table driven by `useGetAllXs` + `XFilterParams` state (page, search, sort, status).
- Enum fields compare against the runtime enum (`StatusEnum.Published`), never string literals.

### 10. State management

- **Server state lives in React Query** (one `ReactQueryProvider` in the root layout). **Client/UI state lives in Redux Toolkit** (`lib/store.ts`); export typed `useAppDispatch`/`useAppSelector` from `lib/hooks.ts` and add an ESLint `no-restricted-imports` rule banning raw `useSelector`/`useDispatch` from `react-redux`.
- Don't mirror API data into Redux — that's what the query cache is for.

### 11. Server-side safety & build hygiene

- Every route handler under `app/api/*` that touches a server secret (upload signing, third-party keys) **must check `getServerSession(authOptions)` first** and 401 otherwise — an unauthenticated signing route is a free credential.
- `next.config`: security headers, `poweredByHeader: false`, strip `console.log`/`console.debug` in production builds (keep errors/warnings), and gate the build on ESLint (`ignoreDuringBuilds: false`) so lint debt cannot ship.
- shadcn/ui configured via `components.json` (aliases `@/components`); build pages from those primitives rather than ad-hoc markup.

### 12. Adding a new entity on the frontend — checklist

1. Backend + shared types already exist (API skill). Rebuild the types package.
2. `services/interfaces/I<X>Service.ts` + `services/<X>Service.ts` (one method per endpoint).
3. `config/types.ts`: add the symbol. `config/ioc.ts`: add the binding.
4. `services/interfaces/IUnitOfService.ts` + `UnitOfService.ts`: add the `XService` property.
5. `hooks/service-hooks/use<X>Service.ts`: query + mutation hooks with the key conventions above.
6. `Manage<X>` dialog form (shared validator) + listing page under the right role area (`admin/…`).
7. If a brand-new role area: extend `middleware.ts`'s `accessControlMap` + `matcher`.

### 13. Definition of done

1. `tsc --noEmit` and `next lint` clean; `next build` passes.
2. Login works for each role and lands on its own area; a wrong-role URL redirects to access-denied; logged-out visits redirect to login.
3. Let an access token expire: the next API call silently refreshes and retries once; a revoked refresh token force-logs-out.
4. Entity flow: create (form validation messages match the API's), list (pagination/search/sort), edit prefilled, delete with the API's 409 message surfaced; the list auto-refreshes after every mutation.
5. No component imports axios or `HttpService` directly; no secret carries `NEXT_PUBLIC_`; no raw `useSelector`/`useDispatch`.
