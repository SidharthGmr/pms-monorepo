# Product Management API

A production-ready Node.js/Express API for product management with TypeScript, Prisma, and PostgreSQL.

## Features

- 🔐 JWT Authentication & Authorization
- 🛡️ Security headers (Helmet)
- 🚦 Rate limiting
- 📦 Product, Category, Order Management
- 👥 User & Staff Management
- 💰 Payment & Salary Processing
- 📊 Dashboard Analytics
- 📝 Swagger API Documentation

## Prerequisites

- Node.js 18+ or higher
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - Generate a secure JWT_SECRET: `openssl rand -hex 32`
   - Configure your DATABASE_URL
   - Set up CLIENT_ID for API security

5. Run Prisma migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

## Development

```bash
npm run dev
```

Server runs at `http://localhost:4000`
Swagger docs at `http://localhost:4000/docs`

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

See `.env.example` for all required environment variables.

### Critical Variables:

- `JWT_SECRET` - Must be a strong random string (32+ characters)
- `CLIENT_ID` - Required for API access control
- `DATABASE_URL` - PostgreSQL connection string

## Security Features

- Helmet for security headers
- Rate limiting (15 requests per 15 minutes per IP)
- Client ID validation
- JWT authentication with refresh tokens
- CORS configured for specific origins
- Input validation with Zod

## API Documentation

Swagger documentation is available at `/docs` endpoint.

## Deployment

### Vercel

```bash
vercel --prod
```

Make sure to set environment variables in Vercel dashboard or use:

```bash
node scripts/add-vercel-env.js
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── dtos/          # Data Transfer Objects
├── middleware/     # Express middleware
├── models/        # Data models
├── routes/        # API routes
├── services/      # Business logic
├── schemas/       # Validation schemas
└── utils/         # Utility functions
```

## License

ISC

## Support

For issues and questions, please open an issue in the repository.
