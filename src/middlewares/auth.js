const isAuthorized = (requiredPermissions) => (req, res, next) => {
  // Check if the request contains a token in the Authorization header.
  const token = req.headers.authorization;

  if (!token) {
    // No token provided, return an error.
    return res.status(401).json({ message: 'No token provided.' });
  }

  // Try to verify the token with the secret key.
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // If the token is invalid, return an error.
    if (err) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    // Get the user's permissions from the decoded token.
    const userPermissions = decoded.permissions || [];

    // Check if the user has all of the required permissions.
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    // If the user has the required permissions, continue with the request.
    if (hasRequiredPermissions) {
      next();
    } else {
      // The user does not have the required permissions, return an error.
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
  });
};

module.exports = isAuthorized;
