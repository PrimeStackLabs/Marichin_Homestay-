import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Protect middleware: checks cookie or Authorization header for Bearer token
export const protect = async (req, res, next) => {
  let token = null;

  // 1. Check Bearer token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Check httpOnly cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists or is deactivated.',
        data: null
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.',
      data: null
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to perform this action`,
        data: null
      });
    }
    next();
  };
};

// Staff permission filter for staff vs admin roles
// admin = everything
// staff = bookings, enquiries, reviews write, read-only on the rest
export const checkStaffPermissions = (resource) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized', data: null });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role === 'staff') {
      const allowedWriteResources = ['bookings', 'enquiries', 'reviews'];
      const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

      if (isWriteMethod && !allowedWriteResources.includes(resource)) {
        return res.status(403).json({
          success: false,
          message: `Staff role is limited to read-only on ${resource}. Only Admins can modify this.`,
          data: null
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.',
      data: null
    });
  };
};

