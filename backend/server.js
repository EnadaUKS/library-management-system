// server.js
// Pika hyrese e aplikacionit backend.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const loanRoutes = require('./routes/loans');
const { startReminderJob } = require('./jobs/reminderJob');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);

// Trajtim qendror i gabimeve
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Gabim i papritur në server' });
});

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveri po dëgjon në portin ${PORT}`);
    startReminderJob();
  });
}

module.exports = app; // eksportuar per testet (supertest)
