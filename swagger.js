const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Library API',
      version: '1.0.0',
      description: 'API for managing books and authors with full CRUD operations',
      contact: {
        name: 'Student Name',
        email: 'student@byui.edu'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://book-library-api.onrender.com',
        description: 'Production server'
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
        name: 'API',
        description: 'API information'
      }
    ],
    components: {
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
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};