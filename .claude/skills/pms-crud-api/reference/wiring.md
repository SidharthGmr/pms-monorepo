# Wiring: the 5 registration edits

Nothing works until all five are done. Symptoms of a missing edit:

| Symptom | Missing edit |
|---|---|
| `No matching bindings found for serviceIdentifier: Symbol(CouponController)` at boot | #1 or #2 |
| `Cannot read properties of undefined (reading 'findAll')` inside the service | #3 |
| `this.unitOfService.Coupon is undefined` in the controller | #4 |
| Routes 404 even though the file exists | #5 |

Keep every list in the **same order** across all files (append at the end of each
block) — that's how the existing entities are laid out, and it makes the parallel
lists diffable.

---

## 1. `src/config/ioc.types.ts`

Three new symbols, added to their respective groups (services near the top,
controllers in the middle, repositories at the bottom). The `Symbol.for` string
drops the leading `I`:

```ts
  ICouponService: Symbol.for('CouponService'),
  ...
  CouponController: Symbol.for('CouponController'),
  ...
  ICouponRepository: Symbol.for('CouponRepository'),
```

---

## 2. `src/config/ioc.config.ts`

Four imports + three binds. Imports are grouped by kind (controllers, service
interfaces, service impls, repo impls, repo interfaces) — add to the matching group:

```ts
import { CouponController } from '../controllers/coupon.controller';
import { ICouponService } from '../services/interfaces/Icoupon.service';
import { CouponService } from '../services/coupon.service';
import { CouponRepository } from '../repository/coupon.repository';
import { ICouponRepository } from '../repository/interfaces/icoupon.repository';
```

```ts
container.bind<CouponController>(TYPES.CouponController).to(CouponController);
container.bind<ICouponService>(TYPES.ICouponService).to(CouponService);
container.bind<ICouponRepository>(TYPES.ICouponRepository).to(CouponRepository);
```

Order matters only in that the three bind blocks are grouped (controllers, then
services, then repositories) — put each line at the end of its own block.

---

## 3. `src/repository/interfaces/iunitofwork.repository.ts` + `src/repository/unitofwork.repository.ts`

Interface — one import, one property:

```ts
import { ICouponRepository } from './icoupon.repository';
// inside `export default interface IUnitOfWork {`
  Coupon: ICouponRepository;
```

Implementation — **four** parallel additions (import, public field, constructor
default param, assignment). Missing the constructor param is the classic bug: the
field stays `undefined` and every call through `unitOfWork.Coupon` throws.

```ts
import { ICouponRepository } from './interfaces/icoupon.repository';

export default class UnitOfWork implements IUnitOfWork {
  public Coupon: ICouponRepository;                                    // 1

  constructor(
    coupon = container.get<ICouponRepository>(TYPES.ICouponRepository), // 2
  ) {
    this.Coupon = coupon;                                              // 3
  }
}
```

---

## 4. `src/services/interfaces/iunitof.service.ts` + `src/services/unitOfService.ts`

Exactly the same four-part shape, one level up:

```ts
// iunitof.service.ts
import { ICouponService } from './Icoupon.service';
  Coupon: ICouponService;
```

```ts
// unitOfService.ts
import { ICouponService } from './interfaces/Icoupon.service';

export default class UnitOfService implements IUnitOfService {
  public Coupon: ICouponService;

  constructor(
    coupon = container.get<ICouponService>(TYPES.ICouponService),
  ) {
    this.Coupon = coupon;
  }
}
```

---

## 5. `src/routes/index.routes.ts`

```ts
import couponRouter from './couponRoutes';
...
routes.use('/coupons', couponRouter);
```

Path segment is **plural kebab-case** (`/brand-names`, `/product-variants`,
`/price-histories`, `/staff-salaries`). `routes` itself is mounted in `index.ts`
after the client-id gate, so the full URL is `http://localhost:4000/coupons`.

---

## Verify

```bash
cd apps/api
npx tsc --noEmit     # no test runner exists in this repo
npm run dev          # boot — a missing bind fails here, loudly
```

Then exercise the resource. Swagger UI (`http://localhost:4000/api`) has the bearer
token + `clientId` inputs wired up, which is the fastest path. From curl during local
dev, set `SITE_MODE=local` in `apps/api/.env` to bypass the client-id gate, or send
the header:

```bash
curl -H "clientId: $CLIENT_ID" -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/coupons?page=1&recordPerPage=10"
```

Checklist for a finished resource:

- [ ] list is paginated, honours `search`/`status`/`showAllRecords`, and is scoped by `storeCode`
- [ ] `sortBy` outside `SORTABLE_COLUMNS` falls back instead of throwing
- [ ] unknown id → 404 with `{ success: false, message: '... not found' }`
- [ ] create ignores a `storeCode` in the body and uses the token's
- [ ] duplicate create → 400 with the humanized P2002 message (no service-level pre-check)
- [ ] delete sets `status: Trash` and the row disappears from the default list
- [ ] every route appears under its tag in `/api`
