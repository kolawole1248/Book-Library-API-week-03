// server.js - UPDATED WITH OAUTH SESSION SUPPORT
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

// Import Swagger setup
const setupSwagger = require('./swagger');

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true // Allow cookies/sessions
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'book-library-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // Session TTL: 24 hours
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Setup Swagger documentation
setupSwagger(app);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

// Log connection attempt
console.log('🔗 Attempting MongoDB connection...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Authentication required:', process.env.REQUIRE_AUTH || 'false');

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  console.log('💡 Create a .env file with:');
  console.log('   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/bookLibraryDB?retryWrites=true&w=majority');
  console.log('   PORT=3000');
  console.log('   SESSION_SECRET=your-secret-key-here');
} else {
  console.log('✅ MONGODB_URI found in environment');
}

// Connecting to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db?.databaseName || 'Connecting...');
    
    // Check if collections exist
    mongoose.connection.db?.listCollections().toArray()
      .then(collections => {
        const collectionNames = collections.map(c => c.name).filter(name => !name.startsWith('system.'));
        console.log('📚 Collections found:', collectionNames.join(', ') || 'None');
      })
      .catch(err => {
        console.log('⚠️  Could not list collections:', err.message);
      });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your .env file has correct MONGODB_URI');
    console.log('2. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0');
    console.log('3. Check if database exists in MongoDB Atlas');
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

// Simple authentication check middleware (for testing)
app.use((req, res, next) => {
  // For testing/demo: Check for demo user header
  if (req.headers['x-demo-user']) {
    req.user = {
      _id: req.headers['x-demo-user'],
      displayName: 'Demo User',
      email: 'demo@example.com',
      role: 'user'
    };
    console.log('👤 Demo user authenticated:', req.user._id);
  }
  next();
});

// Import routes
try {
  const routes = require('./routes');
  app.use('/', routes);
  console.log('✅ Main routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading main routes:', error.message);
  
  // Simple fallback routes if routes file fails
  app.get('/', (req, res) => {
    res.json({
      message: 'Book Library API is running!',
      version: '1.0.0',
      authentication: process.env.REQUIRE_AUTH === 'true' ? 'Required' : 'Optional',
      endpoints: {
        docs: 'GET /api-docs',
        health: 'GET /health',
        books: 'GET /books',
        demoLogin: 'Use header: x-demo-user: any-id'
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
  
  const sessionInfo = req.session ? {
    hasSession: true,
    sessionId: req.session.id
  } : {
    hasSession: false
  };
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    authentication: {
      required: process.env.REQUIRE_AUTH === 'true',
      hasUser: !!req.user,
      session: sessionInfo
    },
    database: {
      status: statusMessages[dbStatus] || 'unknown',
      readyState: dbStatus
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Demo authentication endpoints (for testing before OAuth)
app.post('/auth/demo/login', (req, res) => {
  const userId = req.body.userId || 'demo-user-123';
  
  req.session.userId = userId;
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    res.json({
      success: true,
      message: 'Demo login successful',
      user: {
        id: userId,
        displayName: 'Demo User',
        email: 'demo@example.com',
        note: 'This is demo authentication. Use OAuth in production.'
      }
    });
  });
});

app.post('/auth/demo/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    res.json({
      success: true,
      message: 'Demo logout successful'
    });
  });
});

app.get('/auth/demo/current', (req, res) => {
  if (req.session.userId) {
    res.json({
      success: true,
      user: {
        id: req.session.userId,
        displayName: 'Demo User',
        email: 'demo@example.com',
        isDemo: true
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Not authenticated (demo)'
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Global error handler:', err);
  
  // Session errors
  if (err.name === 'SessionError') {
    return res.status(401).json({
      success: false,
      error: 'Session Error',
      message: 'Authentication session error'
    });
  }
  
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
      authentication: {
        docs: 'GET /api-docs',
        health: 'GET /health',
        demoLogin: 'POST /auth/demo/login',
        demoLogout: 'POST /auth/demo/logout',
        demoCurrent: 'GET /auth/demo/current'
      }
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
    console.log(`🔐 Demo Auth: http://localhost:${PORT}/auth/demo/login`);
    console.log('='.repeat(60) + '\n');
    
    // Log important info
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`🗄️  MongoDB Status: ${states[dbState] || 'unknown'}`);
    console.log(`🔐 Authentication: ${process.env.REQUIRE_AUTH === 'true' ? 'REQUIRED' : 'OPTIONAL'}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Demo instructions
    if (process.env.REQUIRE_AUTH !== 'true') {
      console.log('\n💡 Demo Authentication Instructions:');
      console.log('1. POST /auth/demo/login with {"userId": "your-id"}');
      console.log('2. Use x-demo-user header: your-id');
      console.log('3. Check /health for authentication status');
    }
  });
}

module.exports = app;