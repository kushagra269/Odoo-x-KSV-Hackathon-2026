/**
 * authorize(...roles) — checks that req.user.role is in the allowed list.
 * Must be used AFTER the authenticate middleware.
 *
 * Usage:
 *   router.post('/', authenticate, authorize('admin', 'procurement_officer'), controller.create);
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error:   `Access denied. Requires one of: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = authorize;
