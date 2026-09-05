// tests/api.test.js
// Teste integrimi per rrugët kryesore te API-se, duke perdorur nje databaze
// SQLite te perkohshme (in-memory) per çdo ekzekutim testesh.

process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test_secret';
process.env.LOAN_PERIOD_DAYS = '14';

const request = require('supertest');
const app = require('../server');

let adminToken;
let memberToken;
let bookId;

describe('Auth', () => {
  test('regjistron nje admin dhe kthen token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'parola123',
      role: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    adminToken = res.body.token;
  });

  test('regjistron nje anetar te zakonshem', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Anetar Test',
      email: 'member@test.com',
      password: 'parola123',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('member');
    memberToken = res.body.token;
  });

  test('refuzon login me kredenciale te gabuara', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: 'gabim' });
    expect(res.status).toBe(401);
  });
});

describe('Books', () => {
  test('admin mund te shtoje nje liber', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Kanuni i Lekë Dukagjinit', author: 'Shtjefën Gjeçovi', total_copies: 2 });
    expect(res.status).toBe(201);
    bookId = res.body.id;
  });

  test('anetari NUK mund te shtoje liber (autorizim)', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Libri X', author: 'Autori Y' });
    expect(res.status).toBe(403);
  });

  test('kerkimi i librave sipas titullit', async () => {
    const res = await request(app).get('/api/books?search=Kanuni');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('Loans', () => {
  test('anetari huazon nje liber te disponueshem', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ book_id: bookId });
    expect(res.status).toBe(201);
    expect(res.body.due_date).toBeDefined();
  });

  test('sasia e disponueshme zvogelohet pas huazimit', async () => {
    const res = await request(app).get(`/api/books/${bookId}`);
    expect(res.body.available_copies).toBe(1);
  });

  test('huazimi refuzohet kur nuk ka kopje te disponueshme', async () => {
    // huazo kopjen e fundit
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ book_id: bookId });

    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ book_id: bookId });
    expect(res.status).toBe(409);
  });

  test('kthimi i librit rrit sasine e disponueshme', async () => {
    const loans = await request(app)
      .get('/api/loans/me')
      .set('Authorization', `Bearer ${memberToken}`);
    const loanId = loans.body[0].id;

    const res = await request(app)
      .put(`/api/loans/${loanId}/return`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);

    const book = await request(app).get(`/api/books/${bookId}`);
    expect(book.body.available_copies).toBe(1);
  });
});
