# Layer templates

Comments in these templates are kept to the two cases the rule in `SKILL.md` allows — the
sort allow-list and the transaction-scoping note. Copy the code, not the prose around it.

Example entity: **`Coupon`** (kebab `coupon`, route `/coupons`, Prisma model `coupon`).
Replace `Coupon` / `coupon` / `coupons` throughout. Assumes the Prisma model has
`id`, `name`, `storeCode`, `status`, `displayOrder?`, `createdAt`, `updatedAt`.

---

## 1. `packages/types/src/dto/coupon.dto.ts`

```ts
import { Status } from '../enum/status.enum';

export interface CouponDto {
  id: number;
  name: string;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

```

The read shape only. The write payload is its own file — see section 1b.

`Status` is the string union from `packages/types/src/enum/status.enum`, never Prisma's enum:
this package is a dependency of `apps/web` too, so importing `@prisma/client` here drags a
server-only package into the browser build. Same reason a Prisma `Json` column is typed
`unknown` rather than `Prisma.JsonValue`.

---

## 1b. `packages/types/src/model/coupon.model.ts`

```ts
import { Status } from '../enum/status.enum';

export interface CouponModel {
  name: string;
  status?: Status;
  displayOrder?: number;
}
```

**One model for create and update.** `CouponModel` is the payload for both, so a new field is
added once and both paths accept it. Add a separate update model only when update genuinely
accepts a different set of fields, and derive it instead of retyping the shared half:

```ts
export interface UpdateCouponModel extends Omit<CouponModel, 'createdById'> {
  updatedById: string;
}
```

`storeCode` is never in the model — it comes from the JWT.

---

## 2. `packages/types/src/params/coupon.params.ts`

```ts
import { Status } from '../enum/status.enum';
import { PageFilterParams } from './page.params';

export interface CouponFilterParams extends PageFilterParams {
  status?: Status;
}
```

Declare only what is specific to this resource. `PageFilterParams` already supplies `search`,
`startDate`, `endDate`, `page`, `recordPerPage`, `showAllRecords`, `storeCode`, `sortBy` and
`sortDirection` — redeclaring one narrows it for no reason, and TypeScript only lets you do it
while the narrower type stays assignable to the base.

Two things the base type forces on the repository:

- its dates are `Date | string | null`, so test them with `filters.startDate != null`, never
  `!== undefined`, or a `null` reaches Prisma's `gte`;
- `sortBy` is `string | null`, so it must be checked against `SORTABLE_COLUMNS` before it
  reaches `orderBy`.

---

## 3. `packages/types/src/validator/coupon.validator.ts`

```ts
import { z } from 'zod';
import { StatusEnum } from '../enum/status.enum';

export const couponValidator = z.object({
  body: z.object({
    name: z.string().min(1, 'Coupon name is required'),
    status: z.nativeEnum(StatusEnum).optional(),
    displayOrder: z.number().int().optional(),
  }),
});
```

One validator for both `POST` and `PUT` — add an `updateCouponValidator` only when update really
takes a different set of fields. Its shape is `CouponModel`, field for field, which is also what
the Swagger `requestBody:` block transcribes.

Never require `storeCode` in the validator — it comes from the JWT. The `z.object({ body: … })`
wrapper is mandatory: `validate` calls `schema.safeParse({ body, query, params })`, so an
unwrapped schema rejects every request. `StatusEnum` is the package's own enum — importing
Prisma's here would pull `@prisma/client` into `apps/web`.

---

## 3b. `packages/types/src/index.ts`

Nothing above is visible to either app until it is re-exported from the barrel, under the
heading that matches its folder:

```ts
export * from './params/coupon.params';
export * from './dto/coupon.dto';
export * from './model/coupon.model';
export * from './validator/coupon.validator';
```

Then `npm run build:types` from the repo root — the package resolves through `dist/`, so an
un-built change leaves `apps/api` compiling against the previous surface.

---

## 4. `apps/api/src/repository/interfaces/icoupon.repository.ts`

```ts
import { CouponDto, CouponFilterParams, ListResponseDto } from '@pms/types';

export interface ICouponRepository {
  findAll(
    filters?: CouponFilterParams,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ListResponseDto<CouponDto>>;
  findById(id: number): Promise<CouponDto | null>;
  delete(id: number): Promise<CouponDto>;
}
```

**No `create` or `update` on the repository interface** — note the three methods above.
Reads + soft delete live here; every create/update is written with the transaction client
inside the service's `transaction()` callback. A `transactionClient` is scoped to its transaction
and can't be handed to a repository method that closes over the module-level `prisma`, so
a repository write would run outside the transaction and survive a rollback.

---

## 5. `apps/api/src/repository/coupon.repository.ts`

```ts
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { CouponDto, CouponFilterParams, ListResponseDto, StatusEnum } from '@pms/types';
import { ICouponRepository } from './interfaces/icoupon.repository';

// An arbitrary sortBy reaching Prisma's orderBy is a runtime error, so it is allow-listed.
const SORTABLE_COLUMNS = new Set(['name', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

export class CouponRepository implements ICouponRepository {
  async findAll(
    filters?: CouponFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<CouponDto>> {
    const where: Prisma.couponWhereInput = { NOT: { status: StatusEnum.Trash } };

    if (filters) {
      page = filters.page ?? page;
      limit = filters.recordPerPage ?? limit;

      if (filters.search) {
        where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
      }
      if (filters.status !== undefined) {
        where.status = filters.status;
      }
      if (filters.storeCode !== undefined) {
        where.storeCode = filters.storeCode;
      }
    }

    const showAll = filters?.showAllRecords === true;
    const skip = showAll ? undefined : (page - 1) * limit;
    const take = showAll ? undefined : limit;

    const column = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'createdAt';
    const direction: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.couponOrderByWithRelationInput[] =
      column === 'displayOrder'
        ? [{ displayOrder: { sort: direction, nulls: 'last' } }, { id: 'desc' }]
        : [{ [column]: direction }, { id: 'desc' }];

    const [data, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy,
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
      }),
      prisma.coupon.count({ where }),
    ]);

    return { totalRecord: total, data };
  }

  async findById(id: number): Promise<CouponDto | null> {
    return prisma.coupon.findUnique({ where: { id } });
  }

  async delete(id: number): Promise<CouponDto> {
    return prisma.coupon.update({
      where: { id },
      data: { status: StatusEnum.Trash, updatedAt: new Date() },
    });
  }
}
```

When the model has relations, add an `include` and a local
`function toDto(row: Prisma.couponGetPayload<{ include: ... }>): CouponDto` mapper —
see `brand-name.repository.ts`. Repositories are plain classes here (Inversify 7
doesn't need `@injectable()` for constructor-less classes).

---

## 6. `apps/api/src/services/interfaces/Icoupon.service.ts`

```ts
import { CouponDto, CouponFilterParams, CouponModel, ListResponseDto } from '@pms/types';

export interface ICouponService {
  create(data: CouponModel, storeCode: string): Promise<CouponDto>;
  getAll(filters?: CouponFilterParams): Promise<ListResponseDto<CouponDto>>;
  getById(id: number): Promise<CouponDto | null>;
  update(id: number, data: CouponModel): Promise<CouponDto>;
  delete(id: number): Promise<CouponDto>;
}
```

`create` and `update` take the **same** `CouponModel` — that is the convention, not an
oversight. `storeCode` is a separate argument on `create` because it comes from `req.user`,
never the body, and update must not be able to move a row to another store.

---

## 7. `apps/api/src/services/coupon.service.ts`

```ts
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { CouponDto, CouponFilterParams, CouponModel, ListResponseDto, StatusEnum } from '@pms/types';
import NotFoundError from '../exceptions/not-found-error';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { ICouponService } from './interfaces/Icoupon.service';

@injectable()
export class CouponService implements ICouponService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async create(data: CouponModel, storeCode: string): Promise<CouponDto> {
    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.coupon.create({
        data: {
          name: data.name,
          storeCode,
          status: data.status || StatusEnum.Draft,
          displayOrder: data.displayOrder || null,
        },
      });
    });
  }

  async getAll(filters?: CouponFilterParams): Promise<ListResponseDto<CouponDto>> {
    // PageFilterParams calls it sortDirection; the repository takes sortOrder.
    const sortOrder = filters?.sortDirection?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return this.unitOfWork.Coupon.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy ?? undefined, sortOrder);
  }

  async getById(id: number): Promise<CouponDto | null> {
    const coupon = await this.unitOfWork.Coupon.findById(id);
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  async update(id: number, data: CouponModel): Promise<CouponDto> {
    const existing = await this.unitOfWork.Coupon.findById(id);
    if (!existing) throw new NotFoundError('Coupon not found');

    return this.unitOfWork.transaction(async (transactionClient) => {
      return transactionClient.coupon.update({
        where: { id },
        data: {
          name: data.name,
          status: data.status,
          displayOrder: data.displayOrder || null,
          updatedAt: new Date(),
        },
      });
    });
  }

  async delete(id: number): Promise<CouponDto> {
    const existing = await this.unitOfWork.Coupon.findById(id);
    if (!existing) throw new NotFoundError('Coupon not found');
    return this.unitOfWork.Coupon.delete(id);
  }
}
```

Both writes go through `transactionClient.coupon.*`; there is deliberately no
`this.unitOfWork.Coupon.create(...)` / `.update(...)` to call. Only the reads
(`findById`) and the soft delete come off the repository — so when create later grows a
second write (a history row, a stock movement, a join-table insert) it joins the same
`transactionClient` and rolls back as one unit, with no partial row left behind.

Both writes `return` the call directly, so there is no const to name. If a second write or
a post-write check forces you to bind it, name that const after **this** entity plus `Data`
— `couponData`, never the `storeData` / `categoryData` you inherited from the file you
copied. The suffix is not decoration: it is what makes a stale copy-paste visible, since the
inferred type still compiles and no build catches the wrong name.

`import type IUnitOfWork` is the convention here (it's a type-only import in a file
that uses `emitDecoratorMetadata`). `transaction()` already widens Prisma's timeouts
(maxWait 10s / timeout 20s) for the remote DB; pass `{ timeout }` only if a
multi-table write needs longer.

---

## 8. `apps/api/src/controllers/coupon.controller.ts`

```ts
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CouponDto, CouponFilterParams, CouponModel, CustomResponse, ListResponseDto, StatusEnum } from '@pms/types';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class CouponController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<CouponDto>>> => {
    const body = req.body as CouponModel;
    const storeCode = req.user?.storeCode; // from the logged-in user, never the body
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }
    const data = await this.unitOfService.Coupon.create(body, storeCode);
    return res.status(201).json({ success: true, message: 'Coupon created successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<CouponDto>>>> => {
    // The client sends `sortDirection`; accept `sortOrder` too rather than silently
    // dropping the sort.
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: CouponFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as StatusEnum) : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.Coupon.getAll(filters);
    return res.status(200).json({ success: true, message: 'Coupons fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<CouponDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Coupon.getById(id);
    return res.status(200).json({ success: true, message: 'Coupon fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<CouponDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Coupon.update(id, req.body as CouponModel);
    return res.status(200).json({ success: true, message: 'Coupon updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<CouponDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Coupon.delete(id);
    return res.status(200).json({ success: true, message: 'Coupon deleted successfully', data });
  };
}
```

Notes: bracket access (`req.query['x']`) is the house style throughout the
controllers. The `Object.fromEntries(... .filter(v !== undefined))` dance is required,
not cosmetic: `apps/api/tsconfig.json` sets `exactOptionalPropertyTypes: true`, so
assigning `undefined` to an optional `FilterParams` field is a type error. Return a body-bearing 200 on delete, not 204 (a 204
carries no body, so the client sees nothing — `brand-name.controller.ts` still has
this bug; don't copy it).

---

## 9. `apps/api/src/routes/couponRoutes.ts`

```ts
import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CouponController } from '../controllers/coupon.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { couponValidator } from '@pms/types';

const couponRouter = Router();
const couponController = container.get<CouponController>(TYPES.CouponController);

/**
 * @swagger
 * tags:
 *   - name: Coupon
 *     description: Coupon Management
 */

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, example: "SUMMER10" }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *               displayOrder: { type: integer }
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *       400:
 *         description: Validation error, store code not found, or coupon already exists
 *     description: storeCode is taken from the authenticated user's token.
 */
couponRouter.post('/', authenticateToken, validate(couponValidator), asyncHandler(couponController.create));

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: recordPerPage
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Published, Draft, Trash] }
 *       - in: query
 *         name: showAllRecords
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Coupons fetched successfully
 */
couponRouter.get('/', authenticateToken, asyncHandler(couponController.getAll));

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Coupon fetched successfully
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Coupon not found
 */
couponRouter.get('/:id', authenticateToken, asyncHandler(couponController.getById));

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     summary: Update a coupon
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 1, example: "SUMMER10" }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *               displayOrder: { type: integer }
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Coupon not found
 */
couponRouter.put('/:id', authenticateToken, validate(couponValidator), asyncHandler(couponController.update));

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (soft delete)
 *     tags: [Coupon]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Coupon not found
 */
couponRouter.delete('/:id', authenticateToken, asyncHandler(couponController.delete));

export default couponRouter;
```

Every file above lists its members in the same endpoint order — `create`, `getAll`, `getById`,
`update`, `delete` — and the repository skips straight to `findAll`, `findById`, `delete` because
writes go through `unitOfWork.transaction()`. Keep that order when you copy these, and put any
extra endpoint after `delete`.

Add `authorization([Role.ADMIN])` after `authenticateToken` for admin-only mutations,
and `storeRequiredMiddleware` when the handler cannot work without a store.
Swagger is generated from these JSDoc blocks (`config/swagger.ts`) — an undocumented
route silently disappears from `/api`.

Note what the blocks above do **not** contain: no `description:` on any `parameters:` entry,
and none on the `requestBody:` schema properties. Keep them that way. Descriptions belong on
`tags:`, on each `responses:` status, and at the operation level when the route has a caveat
worth stating — see the `POST /coupons` block.

The status codes in each `responses:` block are exactly the ones these layers emit — the
controller's own `res.status(...)` calls plus the service's `NotFoundError`, with a duplicate
arriving as a 400 (`P2002` → `ClientError`) rather than a 409. Re-derive them for your entity
instead of copying this list: a route whose controller never returns 400 should not document one,
and a delete that answers 204 must be documented as 204.
