const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const logger = require('../../config/logger');

// Helper: log activity
async function logActivity(entity_type, entity_id, action, performed_by, metadata = null) {
  try {
    await db('activity_logs').insert({
      id: uuidv4(),
      entity_type,
      entity_id,
      action,
      performed_by,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date(),
    });
  } catch (err) {
    logger.error('Failed to log activity', { err });
  }
}

// GET /api/vendors
const getAllVendors = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;

    let query = db('vendors')
      .select(
        'vendors.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as created_by_name")
      )
      .leftJoin('users', 'vendors.created_by', 'users.id')
      .orderBy('vendors.created_at', 'desc');

    if (status) query = query.where('vendors.status', status);
    if (category) query = query.where('vendors.category', category);
    if (search) {
      query = query.where(function () {
        this.whereILike('vendors.vendor_name', `%${search}%`)
          .orWhereILike('vendors.gst_number', `%${search}%`)
          .orWhereILike('vendors.contact_name', `%${search}%`);
      });
    }

    const vendors = await query;

    // Count by status for tab badges
    const counts = await db('vendors')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const statusCounts = { all: 0, active: 0, pending: 0, blocked: 0 };
    counts.forEach(({ status, count }) => {
      statusCounts[status] = parseInt(count);
      statusCounts.all += parseInt(count);
    });

    res.json({ vendors, statusCounts });
  } catch (err) {
    next(err);
  }
};

// POST /api/vendors
const createVendor = async (req, res, next) => {
  try {
    const id = uuidv4();
    const now = new Date();

    const vendor = {
      id,
      ...req.body,
      status: 'pending',
      rating: 0,
      created_by: req.user.id,
      created_at: now,
      updated_at: now,
    };

    await db('vendors').insert(vendor);

    await logActivity('vendor', id, `Vendor added: ${req.body.vendor_name}`, req.user.id, {
      vendor_name: req.body.vendor_name,
      category: req.body.category,
    });

    const created = await db('vendors').where({ id }).first();
    res.status(201).json({ vendor: created });
  } catch (err) {
    // Unique constraint on gst_number
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A vendor with this GST number already exists' });
    }
    next(err);
  }
};

// GET /api/vendors/:id
const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await db('vendors').where({ id }).first();
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // PO count and total spend for this vendor
    const [poStats] = await db('purchase_orders')
      .where({ vendor_id: id })
      .count('id as po_count')
      .sum('grand_total as total_spend');

    res.json({
      vendor,
      stats: {
        po_count: parseInt(poStats.po_count) || 0,
        total_spend: parseFloat(poStats.total_spend) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/vendors/:id
const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db('vendors').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'Vendor not found' });

    await db('vendors').where({ id }).update({ ...req.body, updated_at: new Date() });

    await logActivity('vendor', id, `Vendor updated: ${existing.vendor_name}`, req.user.id);

    const updated = await db('vendors').where({ id }).first();
    res.json({ vendor: updated });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A vendor with this GST number already exists' });
    }
    next(err);
  }
};

// PATCH /api/vendors/:id/status
const updateVendorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await db('vendors').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'Vendor not found' });

    await db('vendors').where({ id }).update({ status, updated_at: new Date() });

    await logActivity(
      'vendor',
      id,
      `Vendor status changed to ${status}: ${existing.vendor_name}`,
      req.user.id,
      { old_status: existing.status, new_status: status }
    );

    const updated = await db('vendors').where({ id }).first();
    res.json({ vendor: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllVendors, createVendor, getVendorById, updateVendor, updateVendorStatus };
