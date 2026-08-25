# Layer templates

Example entity: **`Coupon`** (kebab `coupon`, route `/coupons`, Prisma model `coupon`).
Replace `Coupon` / `coupon` / `coupons` throughout. Assumes the Prisma model has
`id`, `name`, `storeCode`, `status`, `displayOrder?`, `createdAt`, `updatedAt`.

---

## 1. `src/dtos/coupon.dto.ts`

```ts
import { Status } from '@prisma/client';

export interface CouponDto {
  id: number;
  name: string;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateCouponDto {
  name: string;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
}
```

`CreateCouponDto` doubles as the update payload in this codebase (see
`IBrandNameService.update`). Add a separate `UpdateCouponDto` only when update
genuinely accepts a different set of fields.

---

## 2. `src/params/coupon.params.ts`

```ts
import { Status } from '@prisma/client';
import { PageFilterParams } from './page.params';

export interface CouponFilterParams extends PageFilterParams {
  status?: Status;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

`PageFilterParams` already supplies `search`, `startDate`, `endDate`, `page`,
`recordPerPage`, `showAllRecords`, `storeCode` — don't redeclare them.

---

## 3. `src/schemas/couponSchema.ts`

```ts
import { Status } from '@prisma/client';
import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Coupon name is required'),
    status: z.nativeEnum(Status).optional(),
    displayOrder: z.number().int().optional(),
  }),
});

export const updateCouponSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    status: z.nativeEnum(Status).optional(),
    displayOrder: z.number().int().optional(),
  }),
});
```

Never require `storeCode` in the schema — it comes from the JWT.

---

## 4. `src/repository/interfaces/icoupon.repository.ts`

```ts
import { CouponDto } from '../../dtos/coupon.dto';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CouponFilterParams } from '../../params/coupon.params';

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

Reads + soft delete live on the repository; creates/updates are done inside the
service's `transaction()` callback (that's the existing pattern — the tx client is
scoped to the transaction, so it can't be handed to a repository method).

---

## 5. `src/repository/coupon.repository.ts`

```ts
import { Prisma, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { CouponDto } from '../dtos/coupon.dto';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CouponFilterParams } from '../params/coupon.params';
import { ICouponRepository } from './interfaces/icoupon.repository';

// Sorting is client-driven, so only real columns are honoured — anything else falls
// back to the default instead of failing the query.
const SORTABLE_COLUMNS = new Set(['name', 'status', 'displayOrder', 'createdAt', 'updatedAt']);

export class CouponRepository implements ICouponRepository {
  async findAll(
    filters?: CouponFilterParams,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ListResponseDto<CouponDto>> {
    const where: Prisma.couponWhereInput = { NOT: { status: Status.Trash } };

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

    // Newest-first by default; when displayOrder is the sort key keep unordered rows
    // (displayOrder = null) at the end instead of letting them lead.
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
      data: { status: Status.Trash, updatedAt: new Date() },
    });
  }
}
```

When the model has relations, add an `include` and a local
`function toDto(row: Prisma.couponGetPayload<{ include: ... }>): CouponDto` mapper —
see `brand-name.repository.ts`. Repositories are plain classes here (Inversify 7
doesn't need `@injectable()` for constructor-less classes).

---

## 6. `src/services/interfaces/Icoupon.service.ts`

```ts
import { CouponDto, CreateCouponDto } from '../../dtos/coupon.dto';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { CouponFilterParams } from '../../params/coupon.params';

export interface ICouponService {
  getAll(filters?: CouponFilterParams): Promise<ListResponseDto<CouponDto>>;
  getById(id: number): Promise<CouponDto | null>;
  create(data: CreateCouponDto, storeCode: string): Promise<CouponDto>;
  update(id: number, data: CreateCouponDto): Promise<CouponDto>;
  delete(id: number): Promise<CouponDto>;
}
```

---

## 7. `src/services/coupon.service.ts`

```ts
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { CouponDto, CreateCouponDto } from '../dtos/coupon.dto';
import { ListResponseDto } from '../dtos/list-response.dto';
import NotFoundError from '../exceptions/not-found-error';
import { CouponFilterParams } from '../params/coupon.params';
import type IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import { ICouponService } from './interfaces/Icoupon.service';

@injectable()
export class CouponService implements ICouponService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async getAll(filters?: CouponFilterParams): Promise<ListResponseDto<CouponDto>> {
    return this.unitOfWork.Coupon.findAll(filters, filters?.page, filters?.recordPerPage, filters?.sortBy, filters?.sortOrder);
  }

  async getById(id: number): Promise<CouponDto | null> {
    const coupon = await this.unitOfWork.Coupon.findById(id);
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  async create(data: CreateCouponDto, storeCode: string): Promise<CouponDto> {
    return this.unitOfWork.transaction(async (tx) => {
      return tx.coupon.create({
        data: {
          name: data.name,
          storeCode,
          status: data.status,
          displayOrder: data.displayOrder || null,
        },
      });
    });
  }

  async update(id: number, data: CreateCouponDto): Promise<CouponDto> {
    const existing = await this.unitOfWork.Coupon.findById(id);
    if (!existing) throw new NotFoundError('Coupon not found');

    return this.unitOfWork.transaction(async (tx) => {
      return tx.coupon.update({
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

`import type IUnitOfWork` is the convention here (it's a type-only import in a file
that uses `emitDecoratorMetadata`). `transaction()` already widens Prisma's timeouts
(maxWait 10s / timeout 20s) for the remote DB; pass `{ timeout }` only if a
multi-table write needs longer.

---

## 8. `src/controllers/coupon.controller.ts`

```ts
import { Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CouponDto, CreateCouponDto } from '../dtos/coupon.dto';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CouponFilterParams } from '../params/coupon.params';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class CouponController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<CouponDto>>>> => {
    // The client sends `sortDirection`; accept `sortOrder` too rather than silently
    // dropping the sort.
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: CouponFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as Status) : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: rawSortDirection ? (rawSortDirection.toLowerCase() === 'asc' ? 'asc' : 'desc') : undefined,
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

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<CouponDto>>> => {
    const body = req.body as CreateCouponDto;
    const storeCode = req.user?.storeCode; // from the logged-in user, never the body
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }
    const data = await this.unitOfService.Coupon.create(body, storeCode);
    return res.status(201).json({ success: true, message: 'Coupon created successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<CouponDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Coupon.update(id, req.body as CreateCouponDto);
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

## 9. `src/routes/couponRoutes.ts`

```ts
import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CouponController } from '../controllers/coupon.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import { validate } from '../middleware/validate';
import { createCouponSchema, updateCouponSchema } from '../schemas/couponSchema';

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
 *         description: Enter Client Id
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
 *       404:
 *         description: Coupon not found
 */
couponRouter.get('/:id', authenticateToken, asyncHandler(couponController.getById));

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
 *         description: Validation error or store code not found
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Coupon already exists
 *     description: storeCode is taken from the authenticated user's token.
 */
couponRouter.post('/', authenticateToken, validate(createCouponSchema), asyncHandler(couponController.create));

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
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 */
couponRouter.put('/:id', authenticateToken, validate(updateCouponSchema), asyncHandler(couponController.update));

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
 */
couponRouter.delete('/:id', authenticateToken, asyncHandler(couponController.delete));

export default couponRouter;
```

Add `authorization([Role.ADMIN])` after `authenticateToken` for admin-only mutations,
and `storeRequiredMiddleware` when the handler cannot work without a store.
Swagger is generated from these JSDoc blocks (`config/swagger.ts`) — an undocumented
route silently disappears from `/api`.
