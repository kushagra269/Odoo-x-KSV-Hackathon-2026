const jwt = require('jsonwebtoken');

/**
 * authenticate — verifies the Bearer JWT in Authorization header.
 * Attaches req.user = { id, role } on success.
 *
 * Usage: router.get('/protected', authenticate, controller.handler);
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error:   'Authentication required. Provide a Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // Only expose what downstream handlers need
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Access token expired.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid access token.' });
  }
}

module.exports = authenticate;
