const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const logger = require('../../config/logger');

// Helper: sign tokens
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

// Helper: log activity
const logActivity = async (entity_type, entity_id, action, performed_by, metadata = null) => {
  try {
    await db('activity_logs').insert({
      id: uuidv4(),
      entity_type,
      entity_id,
      action,
      performed_by,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: db.fn.now(),
    });
  } catch (err) {
    logger.error('Failed to log activity:', err);
  }
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, country, role, additional_info } = req.body;

    // Check if email already exists
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    const [user] = await db('users')
      .insert({
        id,
        first_name,
        last_name,
        email,
        password_hash,
        phone: phone || null,
        country: country || null,
        role,
        additional_info: additional_info || null,
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning(['id', 'first_name', 'last_name', 'email', 'role', 'phone', 'country', 'is_active', 'created_at']);

    await logActivity('user', id, `New user registered: ${email} (${role})`, id);

    logger.info(`User registered: ${email}`);
    return res.status(201).json({ success: true, message: 'Registration successful', data: user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const tokenPayload = { id: user.id, role: user.role };
    const access_token = signAccessToken(tokenPayload);
    const refresh_token = signRefreshToken(tokenPayload);

    logger.info(`User logged in: ${email}`);
    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        access_token,
        refresh_token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          country: user.country,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Make sure user still exists and is active
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    const access_token = signAccessToken({ id: user.id, role: user.role });

    return res.json({ success: true, data: { access_token } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  // Stateless JWT — client drops token
  // Future: add token blocklist here if needed
  return res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, refresh, logout };
