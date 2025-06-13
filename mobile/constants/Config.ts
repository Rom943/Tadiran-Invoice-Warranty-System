// filepath: constants/Config.ts
export default {  // API URL - Replace with your actual backend URL when testing
  API_URL: {
    // For mobile devices, we need to use the network IP of the server
    // localhost and 127.0.0.1 refer to the mobile device itself, not your dev machine
    development: 'http://10.100.102.13:3000',  // Use your computer's network IP
    production: 'https://api.tadiran.com/api',
  },
    // API timeout in milliseconds
  API_TIMEOUT: 30000, // 30 seconds for file uploads
  
  // Default attempts before giving up
  MAX_RETRY_ATTEMPTS: 2,
};
