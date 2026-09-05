# Sistemi i Menaxhimit të Bibliotekës (Library Management System)

Projekt semestral — **Inxhinieria dhe Integrimi i Softuerit**, Programi Master
Profesor: Prof. Besart Prebreza
Repository: https://github.com/EnadaUKS/library-management-system

## Përshkrimi i projektit

Aplikacion web që menaxhon librat, anëtarët dhe procesin e huazim-kthimit në
një bibliotekë, me njoftime automatike me email kur afati i kthimit po afrohet.

## Teknologjitë

- **Backend:** Node.js, Express.js
- **Databaza:** SQLite (better-sqlite3) — relacionale, lehtë e migrueshme në PostgreSQL
- **Autentifikim:** JWT + bcrypt
- **Integrim i jashtëm:** Email API (Nodemailer/SMTP) + cron job për njoftime automatike
- **Frontend:** HTML/CSS/JavaScript (vanilla)
- **Testim:** Jest + Supertest (teste integrimi)

## Struktura e projektit

```
library-system/
├── backend/
│   ├── db/database.js        # skema dhe lidhja me SQLite
│   ├── middleware/auth.js    # verifikim JWT dhe role
│   ├── routes/                # auth.js, books.js, loans.js
│   ├── services/emailService.js
│   ├── jobs/reminderJob.js    # cron job për njoftime
│   ├── tests/api.test.js      # teste integrimi
│   └── server.js
├── frontend/
│   └── index.html             # klienti web
├── diagrams/                  # Use Case, Class, Sequence, ER
└── docs/                      # raporti final dhe dokumentacioni
```

## Instalimi dhe ekzekutimi

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # plotëso JWT_SECRET dhe kredencialet SMTP
npm start                 # serveri niset në http://localhost:4000
```

### 2. Testet

```bash
cd backend
npm test
```

### 3. Frontend

Hap thjesht `frontend/index.html` në browser (ose përdor Live Server).
Sigurohu që backend-i të jetë duke funksionuar në portin 4000.

## API Endpoints kryesore

| Metoda | Rruga | Përshkrimi | Autorizim |
|---|---|---|---|
| POST | /api/auth/register | Regjistrim përdoruesi | Publik |
| POST | /api/auth/login | Hyrje + JWT token | Publik |
| GET | /api/books?search= | Kërkim librash | Publik |
| POST | /api/books | Shto libër | Admin |
| PUT | /api/books/:id | Përditëso libër | Admin |
| DELETE | /api/books/:id | Fshi libër | Admin |
| POST | /api/loans | Huazo libër | Anëtar/Admin |
| PUT | /api/loans/:id/return | Kthe libër | Pronari/Admin |
| GET | /api/loans/me | Huazimet e mia | Anëtar |
| GET | /api/loans | Të gjitha huazimet (raporte) | Admin |

## Integrimi me shërbim të jashtëm

Sistemi integron një **Email API** (SMTP përmes Nodemailer) për:
1. Email mirëseardhje pas regjistrimit
2. Kujtesë automatike (cron job, çdo ditë 08:00) kur afati i kthimit është
   afër, sipas `REMINDER_DAYS_BEFORE_DUE` në `.env`

## Kontribuesi

Emri: Enada Topi
GitHub: [@EnadaUKS](https://github.com/EnadaUKS)
Email: et74999@universum-ks.org
Roli: Full-stack (backend, frontend, databazë, dokumentacion, testim)

## Deklarim i përdorimit të AI

Pjesë e kodit dhe dokumentacionit të këtij projekti u zhvilluan me ndihmën e
një asistenti AI (Claude, Anthropic), nën udhëzimin dhe rishikimin e
studentit/es. Studenti/ja është në gjendje të shpjegojë dhe demonstrojë çdo
pjesë të kodit të dorëzuar, siç kërkohet nga rregullat akademike të
institucionit.
