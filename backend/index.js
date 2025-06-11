const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tadiran Warranty API',
      version: '1.0.0',
      description: 'Warranty activation backend API',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./index.js'], // File to scan for annotations
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /warranties:
 *   get:
 *     summary: Get all warranty requests
 *     responses:
 *       200:
 *         description: List of warranties
 */
app.get('/warranties', (req, res) => {
  res.json([{ id: 1, clientName: 'John Doe', status: 'pending' }]);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Swagger UI on http://localhost:3000/docs');
});
