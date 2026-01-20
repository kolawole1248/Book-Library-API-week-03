const express = require('express');
const router = express.Router();

// Import route modules
const booksRouter = require('./books');
const authorsRouter = require('./authors');

// Mount routes
router.use('/books', booksRouter);
router.use('/authors', authorsRouter);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     tags: [API]
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    api: 'Book Library API',
    version: '1.0.0',
    description: 'API for managing books and authors',
    documentation: `${baseUrl}/api-docs`,
    endpoints: {
      books: {
        getAll: 'GET /books',
        getById: 'GET /books/{id}',
        create: 'POST /books',
        update: 'PUT /books/{id}',
        delete: 'DELETE /books/{id}'
      },
      authors: {
        getAll: 'GET /authors'
      },
      api: {
        documentation: 'GET /api-docs',
        health: 'GET /health'
      }
    },
    database: 'MongoDB',
    collections: ['books', 'authors'],
    note: 'Books require at least 8 required fields for creation'
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;