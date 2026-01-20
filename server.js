// server.js - UPDATED VERSION WITH MONGODB FIX
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Import Swagger setup
const setupSwagger = require('./swagger');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

// MongoDB Connection - FIXED VERSION (no deprecated options)
const MONGODB_URI = process.env.MONGODB_URI;

// Log connection attempt
console.log('🔗 Attempting MongoDB connection...');
console.log('Environment:', process.env.NODE_ENV || 'development');

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  console.log('💡 Create a .env file with:');
  console.log('   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/bookLibraryDB?retryWrites=true&w=majority');
  console.log('   PORT=3000');
} else {
  console.log('✅ MONGODB_URI found in environment');
}

// Connect to MongoDB - SIMPLIFIED (removed deprecated options)
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db?.databaseName || 'Connecting...');
    
    // Check if collections exist
    mongoose.connection.db?.listCollections().toArray()
      .then(collections => {
        console.log('📚 Collections found:', collections.map(c => c.name).join(', ') || 'None');
      })
      .catch(err => {
        console.log('⚠️  Could not list collections:', err.message);
      });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your .env file has correct MONGODB_URI');
    console.log('2. Verify MongoDB Atlas IP whitelist includes your IP (0.0.0.0/0 for all)');
    console.log('3. Check if database "bookLibraryDB" exists in MongoDB Atlas');
    console.log('4. Verify username/password in connection string');
  });

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Import routes
try {
  const routes = require('./routes');
  app.use('/', routes);
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  
  // Simple fallback routes if routes file fails
  app.get('/', (req, res) => {
    res.json({
      message: 'Book Library API is running!',
      error: 'Routes not loaded properly',
      endpoints: {
        docs: 'GET /api-docs',
        health: 'GET /health'
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMessages = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: statusMessages[dbStatus] || 'unknown',
      readyState: dbStatus
    },
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Global error handler:', err);
  
  // MongoDB specific errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'A database error occurred',
      code: err.code
    });
  }
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      errors: err.errors
    });
  }
  
  // Cast errors (invalid ID format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID Format',
      message: 'The provided ID is not valid'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler - MUST BE LAST
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: {
      root: 'GET /',
      books: {
        getAll: 'GET /books',
        getById: 'GET /books/:id',
        create: 'POST /books',
        update: 'PUT /books/:id',
        delete: 'DELETE /books/:id'
      },
      authors: 'GET /authors',
      documentation: 'GET /api-docs',
      health: 'GET /health'
    }
  });
});

const PORT = process.env.PORT || 3000;

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('📚 Book Library API Server Started');
    console.log('='.repeat(60));
    console.log(`📍 Port: ${PORT}`);
    console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
    console.log(`🔧 API Root: http://localhost:${PORT}/`);
    console.log(`📖 Books: http://localhost:${PORT}/books`);
    console.log(`✍️  Authors: http://localhost:${PORT}/authors`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log('='.repeat(60) + '\n');
    
    // Log MongoDB connection state
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`🗄️  MongoDB Status: ${states[dbState] || 'unknown'}`);
  });
}

module.exports = app;