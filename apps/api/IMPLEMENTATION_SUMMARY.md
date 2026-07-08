# Implementation Summary - Store Management

## What Was Implemented

I've successfully updated your application to support store management and multi-tenancy. Here's what was done:

### 1. **Updated DTOs** ✅

- Added `storeId` field to all relevant DTOs to match Prisma schema
- Updated `UpdateUserDto` to include `storeId` for user-store assignment

### 2. **Updated Authentication** ✅

- Modified JWT token payload to include `storeId` in [auth.controller.ts](d:\React\product\node\src\controllers\auth.controller.ts)
- Updated authentication middleware to extract and attach `storeId` to `req.user` in [auth.ts](d:\React\product\node\src\middleware\auth.ts)
- Updated Express type definitions in [express.d.ts](d:\React\product\node\src\types\express.d.ts)

### 3. **Added Store Assignment Endpoint** ✅

- Created `assignStore` method in [user.controller.ts](d:\React\product\node\src\controllers\user.controller.ts)
- Added route `/users/assign-store` with Swagger documentation
- Validates store existence before assignment

### 4. **Created Store Validation Middleware** ✅

- New middleware [store-required.middleware.ts](d:\React\product\node\src\middleware\store-required.middleware.ts)
- Use this on routes that require users to have a store assigned

### 5. **Updated Services** ✅

- Fixed `convertToDto` methods in both `account.service.ts` and `user.service.ts` to include `storeId`

---

## How to Use

### Step 1: User Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Step 2: Create a Store

```http
POST /api/stores
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "My Store",
  "code": "STORE001",
  "address": "123 Main Street",
  "phone": "1234567890",
  "email": "store@example.com",
  "isActive": true,
  "status": "Published"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Store created successfully",
  "data": {
    "id": 1,
    "name": "My Store",
    "code": "STORE001",
    ...
  }
}
```

### Step 3: Assign Store to User

```http
PATCH /api/users/assign-store
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "storeId": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Store assigned successfully",
  "data": {
    "id": 1,
    "userId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "storeId": 1,
    ...
  }
}
```

### Step 4: Login Again to Get StoreId in Token

After assigning the store, the user needs to login again to get a new JWT token with `storeId`:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Now the JWT token will include `storeId`, and it will be available in `req.user.storeId` in all protected routes.

---

## Using StoreId in Your Controllers

### Automatic StoreId Injection

```typescript
// In any controller (e.g., product.controller.ts)
create = async (req: Request, res: Response) => {
  const body = req.body as CreateProductDto;
  const storeId = req.user?.storeId; // Get from authenticated user

  if (!storeId) {
    throw new CustomError('User not assigned to any store', 400);
  }

  // Inject storeId into the data
  const productData = { ...body, storeId };

  const product = await this.unitOfService.Product.create(productData);

  return res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
};
```

### Filtering by StoreId

```typescript
// Filter data to show only items from user's store
getAll = async (req: Request, res: Response) => {
  const storeId = req.user?.storeId;

  if (!storeId) {
    throw new CustomError('User not assigned to any store', 400);
  }

  const products = await this.unitOfService.Product.getAll({
    ...filters,
    storeId, // Filter by store
  });

  return res.status(200).json({
    success: true,
    data: products,
  });
};
```

### Using Store Required Middleware

Protect routes that require a store:

```typescript
import { storeRequiredMiddleware } from '../middleware/store-required.middleware';

// In your route file
router.post(
  '/products',
  authenticateToken, // Must be authenticated
  storeRequiredMiddleware, // Must have a store
  productController.create
);
```

---

## Handling Different Roles

### SUPER_ADMIN - Access All Stores

```typescript
getAll = async (req: Request, res: Response) => {
  const { role, storeId } = req.user!;

  const filters: any = {};

  // SUPER_ADMIN can see all stores, others only their own
  if (role !== 'SUPER_ADMIN') {
    if (!storeId) {
      throw new CustomError('User not assigned to any store', 400);
    }
    filters.storeId = storeId;
  }

  const products = await this.unitOfService.Product.getAll(filters);

  return res.status(200).json({ success: true, data: products });
};
```

### ADMIN - Manage Own Store

```typescript
// Admin can only manage their assigned store
create = async (req: Request, res: Response) => {
  const { storeId } = req.user!;

  if (!storeId) {
    throw new CustomError('Admin must be assigned to a store', 400);
  }

  const data = { ...req.body, storeId };
  const result = await this.unitOfService.Product.create(data);

  return res.status(201).json({ success: true, data: result });
};
```

### STAFF - Assigned to Store

```typescript
// When creating staff, assign them to admin's store
createStaff = async (req: Request, res: Response) => {
  const adminStoreId = req.user?.storeId;

  if (!adminStoreId) {
    throw new CustomError('Admin not assigned to any store', 400);
  }

  const staffData = {
    ...req.body,
    storeId: adminStoreId, // Staff belongs to admin's store
  };

  const staff = await this.unitOfService.Staff.create(staffData);

  return res.status(201).json({ success: true, data: staff });
};
```

---

## Security Best Practices

### 1. **Always Validate Store Ownership**

Before updating or deleting, verify the resource belongs to user's store:

```typescript
update = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userStoreId = req.user?.storeId;

  const product = await this.unitOfService.Product.getById(parseInt(id));

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  // Prevent cross-store access (except SUPER_ADMIN)
  if (req.user?.role !== 'SUPER_ADMIN' && product.storeId !== userStoreId) {
    throw new CustomError('Unauthorized access to this resource', 403);
  }

  const updated = await this.unitOfService.Product.update(parseInt(id), req.body);
  return res.status(200).json({ success: true, data: updated });
};
```

### 2. **Filter All Queries by StoreId**

Update your repository/service methods to always filter by store:

```typescript
// In service
async getAll(filters: ProductFilterParams) {
  const where: any = { status: { not: Status.Trash } };

  // Always add storeId filter
  if (filters.storeId) {
    where.storeId = filters.storeId;
  }

  return this.unitOfWork.Product.getAll({ where });
}
```

---

## Testing Your Implementation

### Test Workflow:

1. **Register a new user**
2. **Create a store** (as SUPER_ADMIN or manually in database)
3. **Assign store to user** using `/users/assign-store`
4. **Login again** to get JWT with storeId
5. **Create products/orders** - they will automatically have the storeId
6. **Query data** - only data from user's store will be returned

### Sample Test Script:

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# 2. Login (first time - no storeId yet)
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

# 3. Create Store
STORE_ID=$(curl -X POST http://localhost:3000/api/stores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "code": "STORE001"
  }' | jq -r '.data.id')

# 4. Assign Store
curl -X PATCH http://localhost:3000/api/users/assign-store \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"storeId\": $STORE_ID}"

# 5. Login again (get new token with storeId)
NEW_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

# 6. Create Product (storeId auto-injected)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "sku": "PROD001",
    "price": 99.99,
    "categoryId": 1
  }'
```

---

## Next Steps

1. **Update all controllers** to inject and filter by `storeId`
2. **Add `storeRequiredMiddleware`** to relevant routes
3. **Update service methods** to filter by storeId
4. **Test with multiple stores** to ensure data isolation
5. **Consider auto-creating store** during admin registration (see [STORE_MANAGEMENT_GUIDE.md](d:\React\product\node\STORE_MANAGEMENT_GUIDE.md))

---

## Files Modified

- ✅ [user.dto.ts](d:\React\product\node\src\dtos\user.dto.ts) - Added storeId to UpdateUserDto
- ✅ [auth.controller.ts](d:\React\product\node\src\controllers\auth.controller.ts) - Added storeId to JWT payload
- ✅ [auth.ts](d:\React\product\node\src\middleware\auth.ts) - Extract storeId from token
- ✅ [express.d.ts](d:\React\product\node\src\types\express.d.ts) - Updated type definition
- ✅ [user.controller.ts](d:\React\product\node\src\controllers\user.controller.ts) - Added assignStore endpoint
- ✅ [userRoutes.ts](d:\React\product\node\src\routes\userRoutes.ts) - Added route with Swagger docs
- ✅ [account.service.ts](d:\React\product\node\src\services\account.service.ts) - Updated convertToDto
- ✅ [user.service.ts](d:\React\product\node\src\services\user.service.ts) - Updated convertToDto
- ✅ All DTO files - Added storeId fields

## Files Created

- ✅ [store-required.middleware.ts](d:\React\product\node\src\middleware\store-required.middleware.ts) - New middleware
- ✅ [STORE_MANAGEMENT_GUIDE.md](d:\React\product\node\STORE_MANAGEMENT_GUIDE.md) - Comprehensive guide
- ✅ [IMPLEMENTATION_SUMMARY.md](d:\React\product\node\IMPLEMENTATION_SUMMARY.md) - This file

---

For detailed information about different implementation approaches, see [STORE_MANAGEMENT_GUIDE.md](d:\React\product\node\STORE_MANAGEMENT_GUIDE.md).
