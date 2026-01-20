const express = require('express');
const router = express.Router();
const authorsController = require('../controllers/authorsController');

/**
 * @swagger
 * /authors:
 *   get:
 *     summary: Get all authors
 *     tags: [Authors]
 *     responses:
 *       200:
 *         description: List of all authors
 *       500:
 *         description: Server error
 */
router.get('/', authorsController.getAllAuthors);

module.exports = router;