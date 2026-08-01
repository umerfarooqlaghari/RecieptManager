import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // We use the Supabase client to verify the user from the token
    // This handles any algorithm (HS256/RS256/ES256) automatically
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth Error:', error?.message || 'User not found');
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
    
    // Attach the user to the request for downstream usage
    // We map 'sub' to 'id' for compatibility with existing code if needed
    (req as any).user = { ...user, sub: user.id }; 
    next();
  } catch (err: any) {
    console.error('Unexpected Auth Error:', err.message);
    return res.status(403).json({ error: 'Forbidden: Authentication failed' });
  }
};
