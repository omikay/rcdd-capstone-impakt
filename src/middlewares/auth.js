const jwt = require('jsonwebtoken');
const process = require('process');

require('dotenv').config();

function isAuthorized(requiredPermissions) {
  return (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    try {
      const decoded = jwt.verify(token,  process.env.JWT_SECRET );
      const userPermissions = decoded.permissions || [];
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (hasRequiredPermissions) {
        // User is authorized, proceed to the next middleware
        next();
      } else {
        return res.status(403).json({ message: 'Insufficient permissions.' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
  };
}

module.exports = isAuthorized;
