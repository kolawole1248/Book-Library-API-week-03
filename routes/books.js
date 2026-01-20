const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const booksController = require('../controllers/booksController');

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
  body('coverImageUrl').optional().isURL(),
  body('availableCopies').isInt({ min: 0 })
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid book ID format')
];

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: List of all books
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
 */
router.post('/', validateBook, booksController.createBook);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Books]
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
 */
router.put('/:id', [...validateObjectId, ...validateBook], booksController.updateBook);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
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
 */
router.delete('/:id', validateObjectId, booksController.deleteBook);

module.exports = router;