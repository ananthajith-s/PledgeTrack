const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error = new Error('Not authorized to access this route');
      error.statusCode = 401;
      throw error;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findById(decoded.id);
      
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 401;
        throw error;
      }

      // Set user in request object
      req.user = {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email
      };
      
      next();
    } catch (error) {
      // JWT verification failed
      error.statusCode = 401;
      error.message = 'Not authorized, token failed';
      throw error;
    }
  } catch (error) {
    next(error);
  }
};