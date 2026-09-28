import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  // In development, allow bypass if dev header is sent
  if (!token && req.headers['x-dev-user-id']) {
    const devId = req.headers['x-dev-user-id'];
    try {
      // Ensure demo user exists in database to satisfy foreign keys
      const user = await prisma.user.upsert({
        where: { email: `${devId}@aistudyplanner.local` },
        update: {},
        create: {
          id: devId,
          email: `${devId}@aistudyplanner.local`,
          passwordHash: 'demo_password_hash',
          fullName: 'Demo Student'
        }
      });
      req.user = { id: user.id, email: user.email };
      return next();
    } catch (err) {
      console.error('Demo user creation error:', err);
      req.user = { id: devId };
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_mode';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
