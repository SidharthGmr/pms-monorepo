# Store Management & Multi-tenancy Guide

## Overview

This guide explains how to handle store creation and data mapping with `storeId` in your multi-tenant application.

## Architecture Understanding

Based on your Prisma schema:

- Users can optionally belong to a store (`storeId?: number`)
- All business entities (Products, Orders, Payments, etc.) MUST have a `storeId`
- This enables multi-store/multi-tenant architecture

---

## Approach 1: Auto-Create Store During Admin Registration (Recommended)

### Best for: SUPER_ADMIN or ADMIN users who manage their own store

### Implementation Steps:

#### 1. Update Registration to Auto-Create Store for Admins

**Location:** `src/services/account.service.ts`

```typescript
async create(data: CreateUserModel, role: Role) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const { otp } = generateOtp();

  return this.unitOfWork.transaction(async (transactionClient) => {
    let storeId: number | null = null;

    // Auto-create store for SUPER_ADMIN or ADMIN
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
      const store = await transactionClient.Store.create({
        data: {
          name: `${data.firstName}'s Store`,
          code: `STORE-${Date.now()}`, // or use UUID
          isActive: true,
          status: 'Published',
        },
      });
      storeId = store.id;
    }

    const user = await transactionClient.users.create({
      data: {
        userId: generateUserGUID().toString(),
        name: `${data.firstName} ${data.lastName}`,
        userName: createUserName(`${data.firstName}`, `${data.lastName}`),
        phone: data.phone || null,
        email: data.email,
        password: hashedPassword,
        emailVerificationToken: otp,
        emailVerificationExpires: this.dateTime.now(),
        isActive: false,
        isEmailVerified: false,
        isPhoneVerified: false,
        storeId: storeId, // Assign store to user
      },
    });

    return this.convertToDto(user);
  });
}
```

---

## Approach 2: Separate Store Creation + User Assignment

### Best for: Flexible scenarios where stores are created independently

### Implementation Steps:

#### Step 1: User registers (without store)

```http
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Step 2: Admin creates a store

```http
POST /api/stores
{
  "name": "My Store",
  "code": "STORE001",
  "address": "123 Main St",
  "phone": "1234567890",
  "email": "store@example.com"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My Store",
    "code": "STORE001",
    ...
  }
}
```

#### Step 3: Assign store to user

**Add new endpoint in `user.controller.ts`:**

```typescript
assignStore = async (req: Request, res: Response): Promise<Response<CustomResponse<UserDto>>> => {
  const userId = req.user?.userId;
  const { storeId } = req.body as { storeId: number };

  if (!userId) {
    throw new CustomError('userId is required', 400);
  }

  if (!storeId) {
    throw new CustomError('storeId is required', 400);
  }

  // Verify store exists
  const store = await this.unitOfService.Store.getById(storeId);
  if (!store) {
    throw new CustomError('Store not found', 404);
  }

  // Update user with storeId
  const user = await this.unitOfService.User.update(userId, { storeId });

  return res.status(200).json({
    success: true,
    message: 'Store assigned successfully',
    data: user,
  });
};
```

**Add route in `routes/user.routes.ts`:**

```typescript
router.patch('/assign-store', authMiddleware, userController.assignStore);
```

**Usage:**

```http
PATCH /api/users/assign-store
Authorization: Bearer <token>
{
  "storeId": 1
}
```

---

## Approach 3: Store Selection During Onboarding

### Best for: Multi-step registration/onboarding flow

Create an onboarding endpoint:

```typescript
// In auth.controller.ts
completeOnboarding = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { storeName, storeCode, address, phone } = req.body;

  if (!userId) {
    throw new CustomError('User not authenticated', 401);
  }

  return this.unitOfService.transaction(async (transactionClient) => {
    // Create store
    const store = await transactionClient.Store.create({
      data: {
        name: storeName,
        code: storeCode,
        address,
        phone,
        isActive: true,
        status: 'Published',
      },
    });

    // Assign store to user
    const user = await transactionClient.users.update({
      where: { userId },
      data: { storeId: store.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed',
      data: { user, store },
    });
  });
};
```

---

## How to Use StoreId in All Operations

### 1. **Get StoreId from Authenticated User**

In your middleware, ensure `req.user` includes `storeId`:

```typescript
// In authentication.middleware.ts
req.user = {
  userId: decoded.userId,
  email: decoded.email,
  role: decoded.role,
  storeId: user.storeId, // Add this
};
```

### 2. **Auto-inject StoreId in Controllers**

**Example: Creating a Product**

```typescript
// In product.controller.ts
create = async (req: Request, res: Response) => {
  const body = req.body as CreateProductDto;
  const storeId = req.user?.storeId;

  if (!storeId) {
    throw new CustomError('User not assigned to any store', 400);
  }

  // Inject storeId
  const productData = { ...body, storeId };

  const product = await this.unitOfService.Product.create(productData);
  return res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
};
```

### 3. **Filter Data by StoreId**

**Example: Getting Products**

```typescript
getAll = async (req: Request, res: Response) => {
  const storeId = req.user?.storeId;

  if (!storeId) {
    throw new CustomError('User not assigned to any store', 400);
  }

  // Filter by storeId
  const products = await this.unitOfService.Product.getAll({
    ...filters,
    storeId, // Add to filters
  });

  return res.status(200).json({
    success: true,
    data: products,
  });
};
```

### 4. **Update Services to Filter by StoreId**

**Example: In product.service.ts**

```typescript
async getAll(filters: ProductFilterParams): Promise<ListResult<ProductDto>> {
  const where: any = {
    status: { not: Status.Trash },
  };

  // Always filter by storeId if provided
  if (filters.storeId) {
    where.storeId = filters.storeId;
  }

  const products = await this.unitOfWork.Product.getAll({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return products;
}
```

---

## Staff Assignment to Stores

When creating staff members:

```typescript
// In staff.controller.ts
create = async (req: Request, res: Response) => {
  const { userId, position, department, salary } = req.body;
  const storeId = req.user?.storeId; // From logged-in admin

  if (!storeId) {
    throw new CustomError('Admin not assigned to any store', 400);
  }

  const staff = await this.unitOfService.Staff.create({
    userId,
    storeId,
    position,
    department,
    salary,
  });

  return res.status(201).json({
    success: true,
    message: 'Staff created successfully',
    data: staff,
  });
};
```

---

## Middleware for Store Validation

Create a middleware to ensure users have a store assigned:

```typescript
// src/middleware/store-required.middleware.ts
export const storeRequiredMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const storeId = req.user?.storeId;

  if (!storeId) {
    return res.status(403).json({
      success: false,
      message: 'You must be assigned to a store to perform this action',
    });
  }

  next();
};
```

**Usage in routes:**

```typescript
router.post('/products', authMiddleware, storeRequiredMiddleware, productController.create);
```

---

## Security Considerations

### 1. **Prevent Cross-Store Data Access**

Always verify storeId matches:

```typescript
// When updating/deleting
const product = await this.unitOfService.Product.getById(id);

if (product.storeId !== req.user?.storeId) {
  throw new CustomError('Unauthorized access to this resource', 403);
}
```

### 2. **SUPER_ADMIN Access**

SUPER_ADMIN should be able to access all stores:

```typescript
const canAccessAllStores = req.user?.role === Role.SUPER_ADMIN;

const where: any = canAccessAllStores ? {} : { storeId: req.user?.storeId };
```

---

## Migration for Existing Users

If you have existing users without stores:

```sql
-- Create a default store
INSERT INTO "Store" (name, code, "isActive", status, "createdAt", "updatedAt")
VALUES ('Default Store', 'DEFAULT', true, 'Published', NOW(), NOW());

-- Assign all existing users to default store
UPDATE users SET "storeId" = (SELECT id FROM "Store" WHERE code = 'DEFAULT');
```

---

## Summary

**Choose the approach based on your needs:**

1. **Auto-create during registration** → Simple, automated, one store per admin
2. **Separate creation + assignment** → Flexible, manual control
3. **Onboarding flow** → Better UX, guided process

**Key Points:**

- Always inject `storeId` from authenticated user
- Filter all queries by `storeId` (except SUPER_ADMIN)
- Validate store ownership before updates/deletes
- Use middleware for store validation
- Handle staff assignments to correct stores

**Next Steps:**

1. Choose your approach
2. Update authentication middleware to include `storeId`
3. Add store validation middleware
4. Update all controllers to use `storeId`
5. Test with multiple stores
