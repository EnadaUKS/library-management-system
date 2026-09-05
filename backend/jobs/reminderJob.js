// jobs/reminderJob.js
// Detyrë e planifikuar (cron) qe kontrollon çdo ditë huazimet aktive dhe dërgon
// email kujtese kur afati i kthimit po afrohet. Ky eshte pjesa "automatike" e
// integrimit me sherbimin e emailit.

const cron = require('node-cron');
const db = require('../db/database');
const { sendDueDateReminder } = require('../services/emailService');

function startReminderJob() {
  // Ekzekutohet çdo ditë në orën 08:00
  cron.schedule('0 8 * * *', async () => {
    const reminderDays = Number(process.env.REMINDER_DAYS_BEFORE_DUE) || 2;

    const loans = db
      .prepare(
        `SELECT l.*, u.name AS user_name, u.email, b.title FROM loans l
         JOIN users u ON l.user_id = u.id
         JOIN books b ON l.book_id = b.id
         WHERE l.status = 'active' AND l.reminder_sent = 0
         AND date(l.due_date) <= date('now', '+' || ? || ' days')`
      )
      .all(reminderDays);

    for (const loan of loans) {
      try {
        await sendDueDateReminder(loan.email, loan.user_name, loan.title, loan.due_date);
        db.prepare('UPDATE loans SET reminder_sent = 1 WHERE id = ?').run(loan.id);
        console.log(`Kujtese e dergume per huazimin #${loan.id}`);
      } catch (err) {
        console.error(`Deshtoi dergimi i kujteses per huazimin #${loan.id}:`, err.message);
      }
    }
  });
}

module.exports = { startReminderJob };
