# Tadiran Invoice Warranty System

A comprehensive warranty management system consisting of a React Admin panel, mobile application, and Node.js backend API. The system allows installers to submit warranty claims with invoice image processing and OCR validation, while administrators can manage warranties, installers, and registration keys.

## 🌐 System Overview

The Tadiran Invoice Warranty System is a full-stack application with three main components:

### **Backend API**
- **Technology**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Features**: JWT authentication, image upload to Cloudinary, Google Vision OCR processing, Swagger API documentation
- **Hosting**: Render

### **Admin Panel**
- **Technology**: React, React Admin, TypeScript
- **Features**: Manage warranties, installers, registration keys, and admin users
- **Authentication**: Bearer token-based
- **Hosting**: Vercel

### **Mobile Application**
- **Technology**: React Native, Expo, TypeScript
- **Features**: Installer login, warranty submission with image capture, warranty status tracking
- **Authentication**: JWT token-based
- **Distribution**: APK build via EAS

## 🔗 Deployment Links

- **Admin Panel**: https://tadiran-invoice-warranty-system.vercel.app
- **Backend API**: https://tadiran-invoice-warranty-system.onrender.com
- **API Documentation (Swagger)**: https://tadiran-invoice-warranty-system.onrender.com/docs


## 🔐 Admin Login Credentials

- **Email**: admin@example.com
- **Password**: [Contact administrator for password]

## � Installer Registration Process

To register a new installer user:
1. **Admin creates registration key**: Login to the admin panel and navigate to "Registration Keys" section
2. **Generate new key**: Click "Create" to generate a unique registration key
3. **Share key with installer**: Provide the generated key to the installer
4. **Installer registration**: The installer uses this key in the registration field of the mobile app to create their account

**Note**: Each registration key can only be used once and is required for installer account creation.

## �📱 Mobile Application

**Download APK**: https://expo.dev/accounts/romamoma/projects/tadiran-warranty/builds/8449d3c4-d856-4f91-8b05-f5d316b3167e

The mobile app is available as an APK build through Expo Application Services (EAS). Use the link above to download the latest APK build, or build the app locally following the setup instructions below.

## 🛠 Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Cloudinary account
- Google Cloud Vision API credentials

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd Tadiran-Invoice-Warranty-System/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the backend directory with the following variables:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/tadiran_warranty

   # JWT & Cookies
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   COOKIE_SECRET=your_cookie_secret

   # Cloudinary (Image Storage)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_FOLDER=warranties

   # Google Vision API
   GOOGLE_VISION_KEY_FILE_PATH=path_to_service_account_json_or_base64_encoded_credentials
   GOOGLE_CLOUD_PROJECT_ID=your_project_id

   # Environment
   NODE_ENV=development
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```


5. **Start the server**
   ```bash
   npm run dev
   ```

### Admin Panel Setup

1. **Navigate to admin directory**
   ```bash
   cd ../admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```


4. **Start the development server**
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. **Navigate to mobile directory**
   ```bash
   cd ../mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

4. **Update API Configuration**
   Edit `mobile/constants/Config.ts` to point to your local backend:
   ```typescript
   development: 'http://your-local-ip:3000',
   ```

5. **Start Expo development server**
   ```bash
   npx expo start
   ```

6. **Build APK (Optional)**
   ```bash
   npm install -g @expo/eas-cli
   eas login
   eas build:configure
   eas build --platform android --profile preview
   ```

## 📊 Database Schema

The system uses PostgreSQL with the following main entities:
- **AdminUser**: System administrators
- **InstallerUser**: Field installers
- **Warranty**: Warranty claims with OCR processing
- **RegistrationKey**: Access keys for installer registration

## 🔧 API Features

- **Authentication**: JWT-based authentication for both web and mobile
- **File Upload**: Cloudinary integration for invoice image storage
- **OCR Processing**: Google Vision API for invoice date extraction and validation
- **CORS Configuration**: Supports both web and mobile client requests
- **API Documentation**: Comprehensive Swagger documentation
- **Error Handling**: Structured error responses with proper HTTP status codes

## 🚀 Deployment Notes

- **Backend**: Deployed on Render with automatic deployments from main branch
- **Admin Panel**: Deployed on Vercel with automatic deployments
- **Mobile App**: Built using EAS Build for distribution
- **Database**: Hosted PostgreSQL database (configure DATABASE_URL accordingly)
- **File Storage**: Cloudinary for image uploads
- **Environment Variables**: All sensitive data stored as environment variables on respective platforms

## 📝 Additional Information

- The system supports Hebrew text input and processing
- OCR validation automatically approves/rejects warranties based on invoice date matching
- Mobile app works offline for viewing previously loaded data
- Admin panel supports real-time warranty status updates
- All API endpoints are documented and testable via Swagger UI

For technical support or additional setup assistance,
contact me on my website: https://romtech.website.
