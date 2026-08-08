import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'rahsia_masjid_123';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemui.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch fresh user data from DB to prevent stale token roles
    getDb().then(db => {
      db.get('SELECT role, name FROM users WHERE id = ?', [decoded.id]).then(dbUser => {
        if (!dbUser) {
          return res.status(401).json({ error: 'Pengguna tidak dijumpai.' });
        }
        
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: dbUser.role,
          name: dbUser.name
        };
        
        // Check if user is pending
        if (req.user.role === 'pending') {
          return res.status(403).json({ error: 'Akaun anda sedang diproses. Sila tunggu kelulusan Super Admin.' });
        }
        
        next();
      }).catch(err => {
        return res.status(500).json({ error: 'Ralat pelayan.' });
      });
    }).catch(err => {
      return res.status(500).json({ error: 'Ralat pelayan.' });
    });
  } catch (err) {
    return res.status(403).json({ error: 'Token tidak sah atau telah tamat tempoh.' });
  }
};

export const verifySuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Akses ditolak. Peranan Super Admin diperlukan.' });
  }
  next();
};

export const verifyRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Super admin can access anything
    if (req.user?.role === 'super_admin') {
      return next();
    }
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tiada kebenaran untuk tindakan ini.' });
    }
    
    next();
  };
};
