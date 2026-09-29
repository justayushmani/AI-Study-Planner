import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  const devId = req.headers['x-dev-user-id'] || 'demo-user-1';

  // 1. Try real JWT verification if a valid non-demo JWT token is sent
  if (token && token !== 'demo_token_development' && token !== 'null' && token !== 'undefined') {
    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_mode';
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      return next();
    } catch (err) {
      // If token expired/invalid, but running with dev ID, allow dev bypass
      if (!req.headers['x-dev-user-id']) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
    }
  }

  // 2. Dev mode / Demo user fallback
  if (devId || token === 'demo_token_development') {
    const targetDevId = devId || 'demo-user-1';
    try {
      // Ensure demo user exists in database to satisfy foreign keys
      const user = await prisma.user.upsert({
        where: { email: `${targetDevId}@aistudyplanner.local` },
        update: {},
        create: {
          id: targetDevId,
          email: `${targetDevId}@aistudyplanner.local`,
          passwordHash: 'demo_password_hash',
          fullName: 'Alex Rivera'
        }
      });
      req.user = { id: user.id, email: user.email };
      return next();
    } catch (err) {
      console.error('Demo user creation error:', err);
      req.user = { id: targetDevId, email: `${targetDevId}@aistudyplanner.local` };
      return next();
    }
  }

  return res.status(401).json({ error: 'Access token required' });
};
