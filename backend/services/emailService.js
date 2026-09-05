// services/emailService.js
// Integrimi me sherbimin e jashtem (Email API permes SMTP/Nodemailer).
// Kjo eshte pika e integrimit qe kerkohet nga udhezuesi i projektit (seksioni 4).
// Ne demonstrim mund te perdoret nje llogari test (Ethereal) qe krijon nje
// "preview link" ne vend te dergimit real te email-it.

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendDueDateReminder(toEmail, userName, bookTitle, dueDate) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Kujtese: afati i kthimit per "${bookTitle}"`,
    text: `Përshëndetje ${userName},\n\nLibri "${bookTitle}" duhet kthyer deri me ${dueDate}.\nJu lutem ktheheni ne bibliotekë para se te skadojë afati.\n\nFaleminderit,\nBiblioteka`,
  });
  return info;
}

async function sendWelcomeEmail(toEmail, userName) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Mirë se vini në sistemin e bibliotekës',
    text: `Përshëndetje ${userName},\n\nLlogaria juaj u krijua me sukses. Tani mund të kërkoni dhe të huazoni libra.\n\nFaleminderit,\nBiblioteka`,
  });
  return info;
}

module.exports = { sendDueDateReminder, sendWelcomeEmail };
