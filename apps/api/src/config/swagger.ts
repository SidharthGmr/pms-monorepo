export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PMS API',
      version: '1.0.0',
      description: 'Product & Inventory Management System - REST API',
    },
    // Relative so Swagger UI targets whatever origin served the page; an absolute
    // URL would bake localhost into the deployed spec.
    servers: [{ url: '/' }],
    tags: [
      { name: 'Account', description: 'Authentication endpoints' },
      { name: 'User', description: 'User endpoints' },
      { name: 'HealthCheck', description: 'Health check endpoints' },
      { name: 'Product', description: 'Product endpoints' },
      { name: 'ProductVariant', description: 'Product Variant' },
      { name: 'Category', description: 'Category endpoints' },
      { name: 'Attribute', description: 'Attribute endpoints' },
      { name: 'BrandName', description: 'Brand name endpoints' },
      { name: 'Dashboard', description: 'Dashboard endpoints' },

      { name: 'Staff', description: 'Staff endpoints' },
      { name: 'StaffAttendance', description: 'Staff attendance endpoints' },
      { name: 'Order', description: 'Order endpoints' },
      { name: 'OrderItem', description: 'Order item endpoints' },
      { name: 'Payment', description: 'Payment endpoints' },
      { name: 'StaffSalary', description: 'Staff salary endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'USER'],
              example: 'ADMIN',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
        Staff: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 5 },
            storeId: { type: 'integer', example: 2 },
            storeCode: { type: 'string', example: 'STORE-123' },
            position: { type: 'string', example: 'Manager' },
            department: { type: 'string', example: 'Sales' },
            hireDate: { type: 'string', format: 'date-time', example: '2026-06-20T23:59:00Z' },
            salary: { type: 'number', example: 5500 },
            isActive: { type: 'boolean', example: true }
          }
        },
        CreateStaffRequest: {
          type: 'object',
          required: ['userId', 'storeId'],
          properties: {
            userId: { type: 'integer', example: 5 },
            storeId: { type: 'integer', example: 2 },
            position: { type: 'string', example: 'Manager' },
            department: { type: 'string', example: 'Sales' },
            hireDate: { type: 'string', format: 'date-time', example: '2026-06-20T23:59:00Z' },
            salary: { type: 'number', example: 5500 },
            isActive: { type: 'boolean', example: true }
          }
        },
        UpdateStaffRequest: {
          type: 'object',
          properties: {
            storeId: { type: 'integer', example: 2 },
            position: { type: 'string', example: 'Manager' },
            department: { type: 'string', example: 'Sales' },
            hireDate: { type: 'string', format: 'date-time', example: '2026-06-20T23:59:00Z' },
            salary: { type: 'number', example: 5500 },
            isActive: { type: 'boolean', example: true }
          }
        },

      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './dist/routes/*.js',
    './api/*.ts', // if vercel uses api folder
  ],
};

/**
 * Local-mode relaxation of the generated spec.
 *
 * The route docs mark `clientId` as a required header, so Swagger UI refuses to fire a
 * request until something is typed into it - even though `clientid.middleware` waives the
 * header entirely when `SITE_MODE=local`. Rather than editing ~50 route doc blocks, the
 * requirement is dropped here (and pre-filled from CLIENT_ID) for local runs only.
 *
 * Authentication is NOT relaxed: `authenticateToken` still demands a real bearer token in
 * local mode, so protected endpoints need a token from `/auth/login` either way.
 */
export function relaxSpecForLocalMode(spec: Record<string, any>): Record<string, any> {
  if (process.env.SITE_MODE !== 'local') return spec;

  const banner = 'SITE_MODE=local: the clientId header is not required. Protected endpoints still need a bearer token from /auth/login.';
  spec['info'] = { ...(spec['info'] ?? {}), description: [spec['info']?.description, banner].filter(Boolean).join(' — ') };

  for (const operations of Object.values(spec['paths'] ?? {}) as Record<string, any>[]) {
    for (const operation of Object.values(operations)) {
      if (!Array.isArray(operation?.parameters)) continue;

      for (const parameter of operation.parameters) {
        if (parameter?.in !== 'header' || String(parameter?.name).toLowerCase() !== 'clientid') continue;
        parameter.required = false;
        if (process.env.CLIENT_ID) parameter.schema = { ...(parameter.schema ?? {}), default: process.env.CLIENT_ID };
      }
    }
  }

  return spec;
}
