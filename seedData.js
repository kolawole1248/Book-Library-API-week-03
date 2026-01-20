const mongoose = require('mongoose');
const Book = require('./models/book');
const Author = require('./models/author');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Book.deleteMany({});
    await Author.deleteMany({});

    // Create authors
    const authors = await Author.insertMany([
      {
        firstName: 'F. Scott',
        lastName: 'Fitzgerald',
        nationality: 'American',
        birthDate: new Date('1896-09-24'),
        deathDate: new Date('1940-12-21'),
        genres: ['Fiction'],
        awards: ['None']
      },
      {
        firstName: 'Harper',
        lastName: 'Lee',
        nationality: 'American',
        birthDate: new Date('1926-04-28'),
        deathDate: new Date('2016-02-19'),
        genres: ['Fiction'],
        awards: ['Pulitzer Prize']
      }
    ]);

    console.log(`Created ${authors.length} authors`);

    // Create books
    const books = await Book.insertMany([
      {
        title: 'The Great Gatsby',
        author: authors[0]._id,
        isbn: '9780743273565',
        genre: 'Fiction',
        publicationYear: 1925,
        publisher: "Charles Scribner's Sons",
        pageCount: 180,
        language: 'English',
        description: 'A novel about the American Dream during the Jazz Age',
        availableCopies: 10
      },
      {
        title: 'To Kill a Mockingbird',
        author: authors[1]._id,
        isbn: '9780061120084',
        genre: 'Fiction',
        publicationYear: 1960,
        publisher: 'J.B. Lippincott & Co.',
        pageCount: 281,
        language: 'English',
        description: 'A novel about racial injustice in the American South',
        availableCopies: 8
      }
    ]);

    console.log(`Created ${books.length} books`);
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();