const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const logger = require('../../config/logger');

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

// Auto-generate RFQ number: RFQ-2025-0001
async function generateRFQNumber() {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;
  const last = await db('rfqs')
    .where('rfq_number', 'like', `${prefix}%`)
    .orderBy('rfq_number', 'desc')
    .first();
  if (!last) return `${prefix}0001`;
  const lastNum = parseInt(last.rfq_number.split('-')[2]) || 0;
  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
}

// GET /api/rfqs
const getAllRFQs = async (req, res, next) => {
  try {
    const { status, created_by, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('rfqs')
      .select(
        'rfqs.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as created_by_name")
      )
      .leftJoin('users', 'rfqs.created_by', 'users.id')
      .orderBy('rfqs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) query = query.where('rfqs.status', status);
    if (created_by) query = query.where('rfqs.created_by', created_by);

    const rfqs = await query;

    // Attach line item count to each RFQ
    const rfqIds = rfqs.map(r => r.id);
    let itemCounts = [];
    if (rfqIds.length > 0) {
      itemCounts = await db('rfq_line_items')
        .whereIn('rfq_id', rfqIds)
        .select('rfq_id')
        .count('id as item_count')
        .groupBy('rfq_id');
    }
    const countMap = {};
    itemCounts.forEach(r => { countMap[r.rfq_id] = parseInt(r.item_count); });
    const result = rfqs.map(r => ({ ...r, item_count: countMap[r.id] || 0 }));

    const totalQuery = db('rfqs');
    if (status) totalQuery.where('status', status);
    const [{ count }] = await totalQuery.count('id as count');

    res.json({ rfqs: result, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// POST /api/rfqs
const createRFQ = async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { title, category, description, deadline, line_items, vendor_ids } = req.body;
    const id = uuidv4();
    const now = new Date();
    const rfq_number = await generateRFQNumber();

    await trx('rfqs').insert({
      id,
      rfq_number,
      title,
      category,
      description: description || null,
      deadline: new Date(deadline),
      status: 'draft',
      created_by: req.user.id,
      created_at: now,
      updated_at: now,
    });

    // Insert line items
    const lineItemRecords = line_items.map(item => ({
      id: uuidv4(),
      rfq_id: id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      created_at: now,
    }));
    await trx('rfq_line_items').insert(lineItemRecords);

    // Insert vendor assignments
    const assignments = vendor_ids.map(vendor_id => ({
      id: uuidv4(),
      rfq_id: id,
      vendor_id,
      invited_at: now,
      status: 'invited',
    }));
    await trx('rfq_vendor_assignments').insert(assignments);

    await trx.commit();

    await logActivity('rfq', id, `RFQ created: ${title}`, req.user.id, {
      rfq_number,
      vendor_count: vendor_ids.length,
      item_count: line_items.length,
    });

    const created = await db('rfqs').where({ id }).first();
    res.status(201).json({ rfq: created });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

// GET /api/rfqs/:id
const getRFQById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rfq = await db('rfqs')
      .select('rfqs.*', db.raw("CONCAT(users.first_name, ' ', users.last_name) as created_by_name"))
      .leftJoin('users', 'rfqs.created_by', 'users.id')
      .where('rfqs.id', id)
      .first();

    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

    const line_items = await db('rfq_line_items').where({ rfq_id: id }).orderBy('created_at');

    const vendor_assignments = await db('rfq_vendor_assignments')
      .select('rfq_vendor_assignments.*', 'vendors.vendor_name', 'vendors.category', 'vendors.email')
      .leftJoin('vendors', 'rfq_vendor_assignments.vendor_id', 'vendors.id')
      .where('rfq_vendor_assignments.rfq_id', id);

    res.json({ rfq, line_items, vendor_assignments });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/rfqs/:id
const updateRFQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('rfqs').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'RFQ not found' });
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft RFQs can be edited' });
    }

    await db('rfqs').where({ id }).update({ ...req.body, updated_at: new Date() });
    await logActivity('rfq', id, `RFQ updated: ${existing.title}`, req.user.id);

    const updated = await db('rfqs').where({ id }).first();
    res.json({ rfq: updated });
  } catch (err) {
    next(err);
  }
};

// POST /api/rfqs/:id/publish
const publishRFQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('rfqs').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'RFQ not found' });
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft RFQs can be published' });
    }

    await db('rfqs').where({ id }).update({ status: 'published', updated_at: new Date() });
    await db('rfq_vendor_assignments').where({ rfq_id: id }).update({ status: 'invited' });

    const vendorCount = await db('rfq_vendor_assignments').where({ rfq_id: id }).count('id as count').first();

    await logActivity('rfq', id, `RFQ published: ${existing.title} — sent to ${vendorCount.count} vendors`, req.user.id, {
      rfq_number: existing.rfq_number,
      vendor_count: parseInt(vendorCount.count),
    });

    const updated = await db('rfqs').where({ id }).first();
    res.json({ rfq: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRFQs, createRFQ, getRFQById, updateRFQ, publishRFQ };
