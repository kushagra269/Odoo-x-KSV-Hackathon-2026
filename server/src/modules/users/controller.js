const db = require('../../config/db');

// GET /api/users/me
const getMe = async (req, res, next) => {
  try {
    const user = await db('users')
      .select('id', 'first_name', 'last_name', 'email', 'phone', 'country', 'role', 'profile_photo_url', 'additional_info', 'is_active', 'created_at')
      .where({ id: req.user.id })
      .first();

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['first_name', 'last_name', 'phone', 'country', 'additional_info', 'profile_photo_url'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date();
    await db('users').where({ id: req.user.id }).update(updates);

    const updated = await db('users')
      .select('id', 'first_name', 'last_name', 'email', 'phone', 'country', 'role', 'profile_photo_url', 'additional_info', 'is_active', 'created_at')
      .where({ id: req.user.id })
      .first();

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe };
