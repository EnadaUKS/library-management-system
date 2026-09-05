// routes/loans.js
const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// POST /api/loans  { book_id }  -> anetari huazon nje liber
router.post('/', authenticate, (req, res) => {
  const { book_id } = req.body;
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
  if (!book) return res.status(404).json({ error: 'Libri nuk u gjet' });
  if (book.available_copies < 1) {
    return res.status(409).json({ error: 'Nuk ka kopje të disponueshme' });
  }

  const loanPeriod = Number(process.env.LOAN_PERIOD_DAYS) || 14;
  const dueDate = addDays(new Date(), loanPeriod);

  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO loans (user_id, book_id, due_date, status) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, book_id, dueDate, 'active');
    db.prepare(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?'
    ).run(book_id);
  });
  tx();

  res.status(201).json({ message: 'Huazimi u krye', due_date: dueDate });
});

// PUT /api/loans/:id/return -> kthimi i librit
router.put('/:id/return', authenticate, (req, res) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Huazimi nuk u gjet' });
  if (loan.status === 'returned') {
    return res.status(409).json({ error: 'Libri është kthyer tashmë' });
  }
  // vetem pronari i huazimit ose admin mund ta kthejne
  if (req.user.role !== 'admin' && req.user.id !== loan.user_id) {
    return res.status(403).json({ error: 'Nuk keni autorizim' });
  }

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE loans SET status = 'returned', return_date = datetime('now') WHERE id = ?"
    ).run(req.params.id);
    db.prepare(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?'
    ).run(loan.book_id);
  });
  tx();

  res.json({ message: 'Libri u kthye me sukses' });
});

// GET /api/loans/me -> huazimet e mia
router.get('/me', authenticate, (req, res) => {
  const loans = db
    .prepare(
      `SELECT l.*, b.title, b.author FROM loans l
       JOIN books b ON l.book_id = b.id WHERE l.user_id = ? ORDER BY l.loan_date DESC`
    )
    .all(req.user.id);
  res.json(loans);
});

// GET /api/loans -> te gjitha huazimet (vetem admin) - per raporte
router.get('/', authenticate, requireRole('admin'), (req, res) => {
  const loans = db
    .prepare(
      `SELECT l.*, b.title, u.name AS user_name, u.email FROM loans l
       JOIN books b ON l.book_id = b.id
       JOIN users u ON l.user_id = u.id
       ORDER BY l.loan_date DESC`
    )
    .all();
  res.json(loans);
});

module.exports = router;
