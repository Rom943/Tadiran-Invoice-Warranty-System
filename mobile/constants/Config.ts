// filepath: constants/Config.ts
export default {  // API URL - Replace with your actual backend URL when testing
  API_URL: {
    // For mobile devices, we need to use the network IP of the server
    development: 'https://tadiran-invoice-warranty-system.onrender.com',  // Use your computer's network IP
    production: 'https://tadiran-invoice-warranty-system.onrender.com',
  },
    // API timeout in milliseconds
  API_TIMEOUT: 30000, // 30 seconds for file uploads
  
  // Default attempts before giving up
  MAX_RETRY_ATTEMPTS: 2,
};
