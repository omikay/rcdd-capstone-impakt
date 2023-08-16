const jwt = require('jsonwebtoken');

function isAuthorized(requiredPermissions) {
  return (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token.' });
      }

      const userPermissions = decoded.permissions || [];
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (hasRequiredPermissions) {
        next();
      } else {
        return res.status(403).json({ message: 'Insufficient permissions.' });
      }
    });
  };
}

module.exports = isAuthorized;
