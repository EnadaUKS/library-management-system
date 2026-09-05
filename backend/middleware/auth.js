// middleware/auth.js
// Verifikon JWT token-in dhe mbron rrugët. requireRole kontrollon autorizimin
// (p.sh. vetem admin mund te shtoje libra).

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Mungon token i autentifikimit' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token i pavlefshem ose i skaduar' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nuk keni autorizim per kete veprim' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
