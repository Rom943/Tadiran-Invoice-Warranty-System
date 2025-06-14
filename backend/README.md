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
   
   # Cloudinary configuration (for image uploads)
   CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
   CLOUDINARY_API_KEY="your_cloudinary_api_key"
   CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
   CLOUDINARY_FOLDER="warranties"
     # Google Cloud Vision API configuration
   GOOGLE_VISION_KEY_FILE_PATH="path/to/your/service-account-key.json OR base64-encoded-json"
   GOOGLE_CLOUD_PROJECT_ID="your-google-cloud-project-id"
   ```

3. Set up Google Cloud Vision API:
   - Create a Google Cloud project
   - Enable the Vision API
   - Create a service account and download the JSON key file
   - Either:
     - Set the `GOOGLE_VISION_KEY_FILE_PATH` to the path of your JSON key file, OR
     - Base64-encode your JSON key file and set `GOOGLE_VISION_KEY_FILE_PATH` to the encoded string
   - Set `GOOGLE_CLOUD_PROJECT_ID` to your project ID

4. Run the database migrations:
   ```
   npx prisma migrate dev
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. For production:
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

## OCR Processing

The system uses **Google Cloud Vision API** for optical character recognition (OCR) to automatically process invoice images and validate warranty dates. 

### How it works:
1. When a warranty is submitted with an invoice image, the system automatically processes it using Google Cloud Vision API
2. The OCR service extracts text from the image and attempts to find dates
3. Found dates are compared against the installation date (±21 days tolerance)
4. Warranty status is automatically set to:
   - **APPROVED**: Invoice date within ±21 days of installation date
   - **REJECTED**: Invoice date outside the acceptable range
   - **IN_PROGRESS**: OCR failed or no dates found (requires manual review)

### Supported Languages:
- English
- Hebrew  
- Arabic

### Image Requirements:
- Supported formats: JPG, JPEG, PNG, GIF, BMP, TIFF, PDF
- File size: 1KB - 50MB
- Good image quality recommended for better OCR accuracy

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
