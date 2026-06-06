const db = require('../../config/db');

// GET /api/activity
const getActivityLogs = async (req, res, next) => {
  try {
    const { entity_type, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('activity_logs')
      .select(
        'activity_logs.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as performed_by_name"),
        'users.role as performed_by_role'
      )
      .leftJoin('users', 'activity_logs.performed_by', 'users.id')
      .orderBy('activity_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (entity_type) query = query.where('activity_logs.entity_type', entity_type);

    const logs = await query;
    const [{ count }] = await db('activity_logs').count('id as count');

    res.json({ logs, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivityLogs };
