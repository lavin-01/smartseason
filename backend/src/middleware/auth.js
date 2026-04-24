const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const {
  isDatabaseConnectionError,
  respondWithDatabaseError,
} = require('../utils/databaseErrors');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (isDatabaseConnectionError(err)) {
      return respondWithDatabaseError(res, err, 'Authentication failed');
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireAgent = (req, res, next) => {
  if (req.user.role !== 'AGENT' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Agent access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireAgent };
