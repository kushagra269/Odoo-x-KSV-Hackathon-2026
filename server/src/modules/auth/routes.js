const router = require('express').Router();
const { register, login, refresh, logout } = require('./controller');
const validate = require('../../middleware/validate');
const { auth } = require('../../middleware/auth');
const { registerSchema, loginSchema, refreshSchema } = require('./schema');
const rateLimit = require('express-rate-limit');

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes.' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login',    authLimiter, validate(loginSchema),    login);
router.post('/refresh',  validate(refreshSchema),               refresh);
router.post('/logout',   auth,                                  logout);

module.exports = router;
