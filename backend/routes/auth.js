// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Emri, email dhe fjalëkalimi janë të detyrueshëm' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Ky email është i regjistruar tashmë' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const safeRole = role === 'admin' ? 'admin' : 'member'; // ne prodhim, 'admin' vetem nga nje admin ekzistues

  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, password_hash, safeRole);

  // Integrim i jashtem: dergo email mirseardhje (nuk bllokon regjistrimin nese deshton)
  sendWelcomeEmail(email, name).catch((e) => console.error('Email deshtoi:', e.message));

  const token = jwt.sign(
    { id: result.lastInsertRowid, role: safeRole, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email, role: safeRole } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Kredenciale të pasakta' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Kredenciale të pasakta' });

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
