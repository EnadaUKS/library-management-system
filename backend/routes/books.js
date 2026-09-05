// routes/books.js
const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/books?search=&category=
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let query = `SELECT b.*, c.name AS category_name FROM books b
               LEFT JOIN categories c ON b.category_id = c.id WHERE 1=1`;
  const params = [];

  if (search) {
    query += ' AND (b.title LIKE ? OR b.author LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ' AND c.name = ?';
    params.push(category);
  }

  const books = db.prepare(query).all(...params);
  res.json(books);
});

// GET /api/books/:id
router.get('/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Libri nuk u gjet' });
  res.json(book);
});

// POST /api/books (vetem admin)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const { title, author, isbn, category_id, total_copies } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Titulli dhe autori jane te detyrueshem' });
  }
  const copies = Number(total_copies) || 1;
  const result = db
    .prepare(
      `INSERT INTO books (title, author, isbn, category_id, total_copies, available_copies)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, author, isbn || null, category_id || null, copies, copies);

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/books/:id (vetem admin)
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const { title, author, isbn, category_id, total_copies } = req.body;
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Libri nuk u gjet' });

  db.prepare(
    `UPDATE books SET title=?, author=?, isbn=?, category_id=?, total_copies=? WHERE id=?`
  ).run(
    title || book.title,
    author || book.author,
    isbn || book.isbn,
    category_id || book.category_id,
    total_copies || book.total_copies,
    req.params.id
  );
  res.json({ message: 'Libri u përditësua' });
});

// DELETE /api/books/:id (vetem admin)
router.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ message: 'Libri u fshi' });
});

module.exports = router;
