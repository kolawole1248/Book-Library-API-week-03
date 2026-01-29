const Book = require('../models/book');
const Author = require('../models/author');
const { validationResult } = require('express-validator');

// GET all books
const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, genre, author } = req.query;
    
    const filter = {};
    if (genre) filter.genre = genre;
    if (author) filter.author = author;
    
    const books = await Book.find(filter)
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Book.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: books.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: books
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// GET single book by ID
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('author', 'firstName lastName nationality birthYear');
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid book ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// POST create new book
const createBook = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    // Check if author exists
    if (req.body.author) {
      const authorExists = await Author.findById(req.body.author);
      if (!authorExists) {
        return res.status(400).json({
          success: false,
          error: 'Author not found',
          message: 'The specified author does not exist'
        });
      }
    }
    
    // Handle ISBN formatting
    if (req.body.isbn) {
      // Remove hyphens and spaces for consistent storage
      req.body.isbn = req.body.isbn.replace(/[-\s]/g, '');
    }
    
    const book = await Book.create(req.body);
    
    // Populate author info
    const populatedBook = await Book.findById(book._id)
      .populate('author', 'firstName lastName');
    
    // Increment author's book count
    if (req.body.author) {
      await Author.findByIdAndUpdate(req.body.author, {
        $inc: { bookCount: 1 }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: populatedBook
    });
  } catch (error) {
    console.error('Error creating book:', error);
    
    // Handle duplicate ISBN
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'Duplicate value error';
      
      if (field === 'isbn') {
        message = `A book with ISBN ${req.body.isbn} already exists`;
      } else if (field === 'title') {
        message = `A book titled "${req.body.title}" already exists`;
      }
      
      return res.status(400).json({
        success: false,
        error: 'Duplicate Entry',
        message: message,
        field: field
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        messages: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// PUT update book
const updateBook = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Check if book exists
    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    // Check if new author exists
    if (req.body.author && req.body.author !== existingBook.author.toString()) {
      const authorExists = await Author.findById(req.body.author);
      if (!authorExists) {
        return res.status(400).json({
          success: false,
          error: 'Author not found',
          message: 'The specified author does not exist'
        });
      }
    }
    
    // Handle ISBN formatting
    if (req.body.isbn) {
      req.body.isbn = req.body.isbn.replace(/[-\s]/g, '');
    }
    
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName');
    
    // Handle author change
    if (req.body.author && req.body.author !== existingBook.author.toString()) {
      // Decrement old author's book count
      await Author.findByIdAndUpdate(existingBook.author, {
        $inc: { bookCount: -1 }
      });
      
      // Increment new author's book count
      await Author.findByIdAndUpdate(req.body.author, {
        $inc: { bookCount: 1 }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: book
    });
  } catch (error) {
    console.error('Error updating book:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid book ID format'
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'Duplicate value error';
      
      if (field === 'isbn') {
        message = `A book with ISBN ${req.body.isbn} already exists`;
      } else if (field === 'title') {
        message = `A book titled "${req.body.title}" already exists`;
      }
      
      return res.status(400).json({
        success: false,
        error: 'Duplicate Entry',
        message: message,
        field: field
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        messages: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// DELETE book
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    // Decrement author's book count
    if (book.author) {
      await Author.findByIdAndUpdate(book.author, {
        $inc: { bookCount: -1 }
      });
    }
    
    await Book.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: {
        id: book._id,
        title: book.title,
        author: book.author
      }
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid book ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// Search books
const searchBooks = async (req, res) => {
  try {
    const { q, field = 'title' } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required',
        message: 'Please provide a search query (q parameter)'
      });
    }
    
    const searchFilter = {};
    
    // Build search filter based on field
    switch (field) {
      case 'title':
        searchFilter.title = { $regex: q, $options: 'i' };
        break;
      case 'genre':
        searchFilter.genre = { $regex: q, $options: 'i' };
        break;
      case 'isbn':
        searchFilter.isbn = q.replace(/[-\s]/g, '');
        break;
      case 'authorName':
        // This would require a different approach with aggregation
        const books = await Book.find()
          .populate({
            path: 'author',
            match: {
              $or: [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } }
              ]
            }
          })
          .then(books => books.filter(book => book.author));
        
        return res.status(200).json({
          success: true,
          count: books.length,
          data: books
        });
      default:
        searchFilter.title = { $regex: q, $options: 'i' };
    }
    
    const books = await Book.find(searchFilter)
      .populate('author', 'firstName lastName')
      .sort({ title: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// Get books by genre
const getBooksByGenre = async (req, res) => {
  try {
    const genre = req.params.genre;
    const books = await Book.find({ genre: new RegExp(genre, 'i') })
      .populate('author', 'firstName lastName')
      .sort({ title: 1 });
    
    res.status(200).json({
      success: true,
      count: books.length,
      genre: genre,
      data: books
    });
  } catch (error) {
    console.error('Error fetching books by genre:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
  getBooksByGenre
};