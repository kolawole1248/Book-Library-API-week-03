const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const booksController = require('../controllers/booksController');

// Import auth middleware (optional for Week 3, required for Week 4)
let isAuthenticated;
try {
  const authMiddleware = require('../middleware/auth');
  isAuthenticated = authMiddleware.isAuthenticated;
  console.log('✅ Auth middleware loaded');
} catch (error) {
  console.log('⚠️  Auth middleware not found, using demo mode');
  // Create demo auth middleware for Week 3
  isAuthenticated = (req, res, next) => {
    // For Week 3: Allow all requests
    // For Week 4: Check req.user or req.session
    if (process.env.REQUIRE_AUTH === 'true' && !req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this endpoint'
      });
    }
    next();
  };
}

// Validation middleware
const validateBook = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ min: 2 }),
  body('author').isMongoId().withMessage('Valid author ID is required'),
  body('isbn').notEmpty().withMessage('ISBN is required').matches(/^\d{10}(\d{3})?$/),
  body('genre').isIn(['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Biography', 'History', 'Self-Help', 'Other']),
  body('publicationYear').isInt({ min: 1000, max: new Date().getFullYear() }),
  body('publisher').notEmpty().trim(),
  body('pageCount').isInt({ min: 1 }),
  body('language').optional().trim(),
  body('description').optional().isLength({ max: 1000 }),
  // FIXED: Allow relative URLs starting with / and empty values
  body('coverImageUrl').optional().custom(value => {
    if (!value || value === '') return true; // Allow empty
    if (value.startsWith('/')) return true; // Allow relative URLs
    if (value.startsWith('http://') || value.startsWith('https://')) return true; // Allow absolute URLs
    throw new Error('coverImageUrl must be empty, start with /, or be a valid URL');
  }),
  body('availableCopies').isInt({ min: 0 })
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid book ID format')
];

// Routes

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     description: Get all books. If authentication is required, only returns user's books.
 *     responses:
 *       200:
 *         description: List of books
 *       500:
 *         description: Server error
 */
router.get('/', booksController.getAllBooks);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get a book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book found
 *       404:
 *         description: Book not found
 *       400:
 *         description: Invalid ID format
 */
router.get('/:id', validateObjectId, booksController.getBookById);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - isbn
 *               - genre
 *               - publicationYear
 *               - publisher
 *               - pageCount
 *               - availableCopies
 *             properties:
 *               title:
 *                 type: string
 *                 example: "The Great Gatsby"
 *               author:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               isbn:
 *                 type: string
 *                 example: "9780743273565"
 *               genre:
 *                 type: string
 *                 example: "Fiction"
 *               publicationYear:
 *                 type: integer
 *                 example: 1925
 *               publisher:
 *                 type: string
 *                 example: "Charles Scribner's Sons"
 *               pageCount:
 *                 type: integer
 *                 example: 180
 *               language:
 *                 type: string
 *                 example: "English"
 *               description:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *               availableCopies:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required (Week 4)
 */
router.post('/', isAuthenticated, validateBook, booksController.createBook);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Books]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: Book updated
 *       404:
 *         description: Book not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required (Week 4)
 */
router.put('/:id', isAuthenticated, [...validateObjectId, ...validateBook], booksController.updateBook);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted
 *       404:
 *         description: Book not found
 *       401:
 *         description: Authentication required (Week 4)
 */
router.delete('/:id', isAuthenticated, validateObjectId, booksController.deleteBook);

/**
 * @swagger
 * /books/my-books:
 *   get:
 *     summary: Get current user's books
 *     tags: [Books]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's books
 *       401:
 *         description: Authentication required
 */
router.get('/my-books', isAuthenticated, (req, res) => {
  // For Week 3: Return all books (demo mode)
  // For Week 4: Use booksController.getUserBooks
  if (process.env.REQUIRE_AUTH === 'true') {
    // Call the controller method for Week 4
    return booksController.getAllBooks(req, res);
  }
  
  // Week 3: Return success with demo message
  res.json({
    success: true,
    message: 'In Week 4, this endpoint will show only your books',
    note: 'Currently showing all books (Week 3 mode)'
  });
});

module.exports = router;