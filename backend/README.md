# Tadiran Invoice Warranty System - Backend API

This is the backend API for the Tadiran Invoice Warranty System. It provides JWT authentication with cookies and routes for installer users and admin users to manage warranties.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in `.env` file:
   ```
   DATABASE_URL="your_database_connection_string"
   JWT_SECRET="your_jwt_secret_key"
   JWT_EXPIRES_IN="24h" # JWT token expiration time
   COOKIE_SECRET="your_cookie_secret"
   NODE_ENV="development" # or "production"
   PORT=3000 # optional, defaults to 3000
   ```

3. Run the database migrations:
   ```
   npx prisma migrate dev
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. For production:
   ```
   npm run build
   npm start
   ```

## API Documentation

API documentation is available at `/docs` endpoint using Swagger UI.
- Development: http://localhost:3000/docs
- Production: https://api.tadiran.com/docs

## Authentication

The API uses JWT tokens stored in HTTP-only cookies for authentication. Different routes require different user types (installer or admin).

## API Routes

### Installer Routes

- `POST /api/installer/register` - Register a new installer using a registration key
- `POST /api/installer/login` - Login as installer and receive JWT token in cookie
- `GET /api/installer/warranties` - Get warranties created by the authenticated installer
- `POST /api/installer/logout` - Logout installer (clear cookie)

### Admin Routes

- `POST /api/admin/register` - Register a new admin (requires admin authentication)
- `POST /api/admin/login` - Login as admin and receive JWT token in cookie
- `GET /api/admin/warranties` - Get all warranties (admin only)
- `POST /api/admin/logout` - Logout admin (clear cookie)

### Warranty Routes

- `POST /api/warranties` - Create a new warranty (installer only)
- `GET /api/warranties` - Get warranties based on user role
- `GET /api/warranties/:id` - Get warranty details by ID (admin or warranty owner)
- `PUT /api/warranties/:id` - Update warranty details (admin or warranty owner)
- `PATCH /api/warranties/:id/status` - Update warranty status (admin only)

### Registration Key Routes

- `POST /api/keys` - Create a new installer registration key (admin only)
- `GET /api/keys` - Get all registration keys (admin only)
- `DELETE /api/keys/:id` - Delete an unused registration key (admin only)

## Data Models

- **InstallerUser** - Installers who submit warranties
- **AdminUser** - Administrators who review warranties
- **Warranty** - Warranty records with various statuses
- **InstallerRegistrationKey** - Keys required for installer registration

## Workflow

1. Admin creates registration keys
2. Installers register using registration keys
3. Installers submit warranties with PENDING status
4. Admins review and update warranty status
5. Installers can track their warranty submissions
