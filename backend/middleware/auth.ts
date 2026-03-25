import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Use the exact JWT Key found in the backend .env
const JWT_SECRET = process.env.Jwt_Key;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT Secret is missing in the environment variables');
    }
    
    // Supabase JWTs use RS256 or HS256 depending on config, usually HS256 with the app's JWT secret
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    
    // Attach the decoded Supabase User object to req for downstream usage
    (req as any).user = decoded; 
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};
