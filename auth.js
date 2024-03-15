// controllers/authMiddleware.js
const jwt = require('jsonwebtoken');

const secretKey = 'my-32-character-ultra-secure-and-ultra-long-secret';


const authenticateAndAuthorize = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - Missing token' });
  }

  try {
    const decoded = jwt.verify(token, secretKey); // Replace with your actual secret key
    req.user = decoded;

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Insufficient privileges' });
    }

    next();
  } catch (error) {
    console.error(error.message);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};

module.exports = { authenticateAndAuthorize };
