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

async function generateQuotationNumber() {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;
  const last = await db('quotations')
    .where('quotation_number', 'like', `${prefix}%`)
    .orderBy('quotation_number', 'desc')
    .first();
  if (!last) return `${prefix}0001`;
  const lastNum = parseInt(last.quotation_number.split('-')[2]) || 0;
  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
}

// GET /api/quotations
const getAllQuotations = async (req, res, next) => {
  try {
    const { rfq_id, vendor_id } = req.query;

    let query = db('quotations')
      .select(
        'quotations.*',
        'vendors.vendor_name',
        'vendors.rating as vendor_rating',
        'rfqs.title as rfq_title',
        'rfqs.rfq_number'
      )
      .leftJoin('vendors', 'quotations.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'quotations.rfq_id', 'rfqs.id')
      .orderBy('quotations.created_at', 'desc');

    if (rfq_id) query = query.where('quotations.rfq_id', rfq_id);
    if (vendor_id) query = query.where('quotations.vendor_id', vendor_id);

    const quotations = await query;
    res.json({ quotations });
  } catch (err) {
    next(err);
  }
};

// POST /api/quotations
const createQuotation = async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { rfq_id, line_items, gst_percentage, payment_terms, notes } = req.body;

    // Find vendor linked to this user
    const vendor = await db('vendors').where({ user_id: req.user.id }).first();
    // Fallback: if admin/procurement testing, use first vendor
    const vendor_id = vendor
      ? vendor.id
      : (await db('vendors').first())?.id;

    if (!vendor_id) {
      await trx.rollback();
      return res.status(400).json({ error: 'No vendor profile found for this user' });
    }

    // Check RFQ exists and is published
    const rfq = await db('rfqs').where({ id: rfq_id }).first();
    if (!rfq) { await trx.rollback(); return res.status(404).json({ error: 'RFQ not found' }); }
    if (rfq.status !== 'published') {
      await trx.rollback();
      return res.status(400).json({ error: 'Can only quote on published RFQs' });
    }

    // Calculate totals server-side
    const subtotal = line_items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const gst_amount = parseFloat((subtotal * gst_percentage / 100).toFixed(2));
    const grand_total = parseFloat((subtotal + gst_amount).toFixed(2));

    const id = uuidv4();
    const now = new Date();
    const quotation_number = await generateQuotationNumber();

    await trx('quotations').insert({
      id,
      quotation_number,
      rfq_id,
      vendor_id,
      subtotal: parseFloat(subtotal.toFixed(2)),
      gst_percentage,
      gst_amount,
      grand_total,
      payment_terms: payment_terms || null,
      notes: notes || null,
      status: 'draft',
      submitted_at: null,
      created_at: now,
      updated_at: now,
    });

    // Insert line items
    const lineItemRecords = line_items.map(item => ({
      id: uuidv4(),
      quotation_id: id,
      rfq_line_item_id: item.rfq_line_item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: parseFloat((item.unit_price * item.quantity).toFixed(2)),
      delivery_days: item.delivery_days,
    }));
    await trx('quotation_line_items').insert(lineItemRecords);

    // Update vendor assignment status
    await trx('rfq_vendor_assignments')
      .where({ rfq_id, vendor_id })
      .update({ status: 'submitted' });

    await trx.commit();

    await logActivity('quotation', id, `Quotation created: ${quotation_number} for RFQ ${rfq.rfq_number}`, req.user.id, {
      quotation_number,
      grand_total,
      vendor_id,
    });

    const created = await db('quotations').where({ id }).first();
    res.status(201).json({ quotation: created });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

// GET /api/quotations/:id
const getQuotationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quotation = await db('quotations')
      .select(
        'quotations.*',
        'vendors.vendor_name',
        'vendors.rating as vendor_rating',
        'vendors.contact_name',
        'vendors.email as vendor_email',
        'rfqs.title as rfq_title',
        'rfqs.rfq_number',
        'rfqs.deadline'
      )
      .leftJoin('vendors', 'quotations.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'quotations.rfq_id', 'rfqs.id')
      .where('quotations.id', id)
      .first();

    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    const line_items = await db('quotation_line_items')
      .where({ quotation_id: id })
      .orderBy('id');

    res.json({ quotation, line_items });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/quotations/:id
const updateQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('quotations').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });
    if (existing.status === 'submitted') {
      return res.status(400).json({ error: 'Submitted quotations cannot be edited' });
    }

    await db('quotations').where({ id }).update({ ...req.body, updated_at: new Date() });
    const updated = await db('quotations').where({ id }).first();
    res.json({ quotation: updated });
  } catch (err) {
    next(err);
  }
};

// POST /api/quotations/:id/submit
const submitQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('quotations').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'Quotation not found' });
    if (existing.status === 'submitted') {
      return res.status(400).json({ error: 'Quotation already submitted' });
    }

    const now = new Date();
    await db('quotations').where({ id }).update({
      status: 'submitted',
      submitted_at: now,
      updated_at: now,
    });

    await logActivity('quotation', id, `Quotation submitted: ${existing.quotation_number}`, req.user.id, {
      grand_total: existing.grand_total,
    });

    const updated = await db('quotations').where({ id }).first();
    res.json({ quotation: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllQuotations, createQuotation, getQuotationById, updateQuotation, submitQuotation };
