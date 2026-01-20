const Author = require('../models/author');
const { validationResult } = require('express-validator');

// GET all authors
const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find().sort({ lastName: 1 });
    
    res.status(200).json({
      success: true,
      count: authors.length,
      data: authors
    });
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

module.exports = {
  getAllAuthors
};