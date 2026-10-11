// Role-based access control middleware
// Restricts access to routes based on user roles

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('You must be logged in to access this route');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error('You do not have permission to perform this action');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};