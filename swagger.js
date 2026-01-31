const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// i check if authentication is required
const isAuthRequired = process.env.REQUIRE_AUTH === 'true';
const currentHost = process.env.RENDER_EXTERNAL_URL 
  ? new URL(process.env.RENDER_EXTERNAL_URL).host 
  : 'localhost:3000';
const currentScheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Library API',
      version: '1.0.0',
      description: isAuthRequired 
        ? 'API for managing books and authors with OAuth authentication (Week 4)'
        : 'API for managing books and authors with full CRUD operations (Week 3)',
      contact: {
        name: 'Student Name',
        email: 'student@byui.edu'
      }
    },
    servers: [
      {
        url: `${currentScheme}://${currentHost}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    tags: [
      {
        name: 'Books',
        description: 'Book operations'
      },
      {
        name: 'Authors',
        description: 'Author operations'
      },
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'API',
        description: 'API information'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: isAuthRequired 
            ? 'Session cookie for authenticated users'
            : 'Demo authentication (Week 3 mode)'
        },
        demoHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-demo-user',
          description: 'Demo user ID for testing (Week 3)'
        }
      },
      schemas: {
        Book: {
          type: 'object',
          required: ['title', 'author', 'isbn', 'genre', 'publicationYear', 'publisher', 'pageCount', 'availableCopies'],
          properties: {
            title: {
              type: 'string',
              example: 'The Great Gatsby'
            },
            author: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            user: {
              type: 'string',
              example: '67b123456789abcdef123456',
              description: 'User who created the book (Week 4)'
            },
            isbn: {
              type: 'string',
              example: '9780743273565'
            },
            genre: {
              type: 'string',
              enum: ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Biography', 'History', 'Self-Help', 'Other'],
              example: 'Fiction'
            },
            publicationYear: {
              type: 'integer',
              example: 1925
            },
            publisher: {
              type: 'string',
              example: "Charles Scribner's Sons"
            },
            pageCount: {
              type: 'integer',
              example: 180
            },
            language: {
              type: 'string',
              example: 'English'
            },
            description: {
              type: 'string',
              example: 'A classic novel about the American Dream'
            },
            coverImageUrl: {
              type: 'string',
              example: 'https://example.com/book-cover.jpg'
            },
            availableCopies: {
              type: 'integer',
              example: 5
            }
          }
        },
        Author: {
          type: 'object',
          required: ['firstName', 'lastName', 'nationality', 'birthDate'],
          properties: {
            firstName: {
              type: 'string',
              example: 'F. Scott'
            },
            lastName: {
              type: 'string',
              example: 'Fitzgerald'
            },
            nationality: {
              type: 'string',
              example: 'American'
            },
            birthDate: {
              type: 'string',
              format: 'date',
              example: '1896-09-24'
            },
            deathDate: {
              type: 'string',
              format: 'date',
              example: '1940-12-21'
            },
            biography: {
              type: 'string'
            },
            website: {
              type: 'string',
              example: 'https://example.com/author'
            },
            genres: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            awards: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string'
            },
            message: {
              type: 'string'
            }
          }
        },
        AuthenticationStatus: {
          type: 'object',
          properties: {
            required: {
              type: 'boolean',
              example: isAuthRequired,
              description: 'Is authentication required?'
            },
            authenticated: {
              type: 'boolean',
              example: false,
              description: 'Is user authenticated?'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Authentication required',
                message: 'Please log in to access this resource'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Validation Error',
                message: 'Invalid input data'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './server.js'] // Include server.js for demo auth endpoints
};

const swaggerSpec = swaggerJsdoc(options);

// Dynamically update Swagger based on environment
function setupSwagger(app) {
  // Update server URL dynamically
  if (process.env.RENDER_EXTERNAL_URL) {
    const renderUrl = new URL(process.env.RENDER_EXTERNAL_URL);
    swaggerSpec.servers = [{
      url: renderUrl.origin,
      description: 'Production server (Render)'
    }];
  }
  
  // Adding authentication note
  if (isAuthRequired) {
    swaggerSpec.info.description += '\n\n🔒 **Authentication is REQUIRED** for POST, PUT, DELETE operations.';
  } else {
    swaggerSpec.info.description += '\n\n⚠️ **Demo Mode**: Authentication is optional for Week 3. Set REQUIRE_AUTH=true for Week 4.';
  }
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .auth-wrapper { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
      .auth-note { color: ${isAuthRequired ? '#d32f2f' : '#ff9800'}; font-weight: bold; }
    `,
    customSiteTitle: "Book Library API Documentation",
    customfavIcon: "/favicon.ico"
  }));
  
  console.log(`📚 Swagger UI configured with authentication: ${isAuthRequired ? 'REQUIRED' : 'OPTIONAL'}`);
}

module.exports = setupSwagger;