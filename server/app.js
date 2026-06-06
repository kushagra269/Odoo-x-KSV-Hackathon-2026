require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

const app = express();
const allowedOrigins = new Set([
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function monthRange(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const start = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
}));

if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
}

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'VendorBridge API', version: '1.0.0' });
});

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await db('users')
      .whereRaw('lower(email) = lower(?)', [email])
      .first();

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const accessToken = jwt.sign(
      { sub: user.id, id: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET || 'vendorbridge_access_secret_hackathon_2025',
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );

    res.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        country: user.country,
        profile_photo_url: user.profile_photo_url,
        additional_info: user.additional_info,
      },
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      country,
      role = 'procurement_officer',
      additional_info,
    } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ success: false, error: 'First name, last name, email, and password are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    const now = new Date();

    await db('users').insert({
      id,
      first_name,
      last_name,
      email,
      password_hash: passwordHash,
      phone: phone || null,
      country: country || null,
      role,
      additional_info: additional_info || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    const accessToken = jwt.sign(
      { sub: id, id, role },
      process.env.JWT_ACCESS_SECRET || 'vendorbridge_access_secret_hackathon_2025',
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );

    res.status(201).json({
      success: true,
      accessToken,
      user: { id, first_name, last_name, email, role, phone, country, additional_info },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }
    next(err);
  }
});

app.get('/api/vendors', async (req, res, next) => {
  try {
    const { status = 'all', search = '', category } = req.query;

    let query = db('vendors').select('*').orderBy('created_at', 'desc');
    if (status && status !== 'all') query = query.where({ status });
    if (category) query = query.where({ category });
    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('vendor_name', `%${search}%`)
          .orWhereILike('gst_number', `%${search}%`)
          .orWhereILike('category', `%${search}%`)
          .orWhereILike('contact_name', `%${search}%`);
      });
    }

    const items = await query;
    const statusCounts = await db('vendors').select('status').count('id as count').groupBy('status');
    const counts = { all: 0, active: 0, pending: 0, blocked: 0 };
    statusCounts.forEach((row) => {
      counts[row.status] = Number(row.count || 0);
      counts.all += Number(row.count || 0);
    });

    res.json({ items, counts });
  } catch (err) {
    next(err);
  }
});

app.post('/api/vendors', async (req, res, next) => {
  try {
    const admin = await db('users').where({ role: 'admin' }).first();
    const id = crypto.randomUUID();
    const now = new Date();
    const vendor = {
      id,
      vendor_name: req.body.vendor_name,
      category: req.body.category,
      gst_number: req.body.gst_number,
      contact_name: req.body.contact_name,
      contact_number: req.body.contact_number,
      email: req.body.email,
      address: req.body.address || 'Address pending',
      country: req.body.country || 'India',
      status: 'pending',
      rating: '0.0',
      notes: req.body.notes || null,
      created_by: admin?.id,
      created_at: now,
      updated_at: now,
    };

    if (!vendor.created_by) {
      return res.status(400).json({ success: false, error: 'No admin user is available to own the vendor record.' });
    }

    await db('vendors').insert(vendor);
    res.status(201).json(vendor);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'A vendor with this GST number already exists.' });
    }
    next(err);
  }
});

app.get('/api/rfqs', async (_req, res, next) => {
  try {
    const rfq = await db('rfqs').where({ status: 'published' }).orderBy('created_at', 'desc').first()
      || await db('rfqs').orderBy('created_at', 'desc').first();
    if (!rfq) return res.json({ items: [] });

    const lineItems = await db('rfq_line_items').where({ rfq_id: rfq.id }).orderBy('created_at');
    res.json({ items: [{ ...rfq, line_items: lineItems }] });
  } catch (err) {
    next(err);
  }
});

app.post('/api/rfqs', async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const creator = await trx('users').where({ role: 'procurement_officer' }).first()
      || await trx('users').where({ role: 'admin' }).first();
    if (!creator) {
      await trx.rollback();
      return res.status(400).json({ success: false, error: 'No procurement user is available to create RFQs.' });
    }

    const countResult = await trx('rfqs').count('id as count').first();
    const rfqNumber = `RFQ-2026-${String(Number(countResult.count || 0) + 1).padStart(4, '0')}`;
    const id = crypto.randomUUID();
    const now = new Date();

    await trx('rfqs').insert({
      id,
      rfq_number: rfqNumber,
      title: req.body.title,
      category: req.body.category,
      description: req.body.description || '',
      deadline: req.body.deadline,
      status: req.body.status === 'published' ? 'published' : 'draft',
      created_by: creator.id,
      created_at: now,
      updated_at: now,
    });

    const lineItems = (req.body.line_items || []).map((item) => ({
      id: crypto.randomUUID(),
      rfq_id: id,
      item_name: item.item_name,
      quantity: Number(item.quantity || 1).toFixed(2),
      unit: item.unit || 'NOS',
      created_at: now,
    }));
    if (lineItems.length) await trx('rfq_line_items').insert(lineItems);

    const activeVendors = await trx('vendors').where({ status: 'active' }).select('id');
    const activeIds = new Set(activeVendors.map((vendor) => vendor.id));
    const selectedVendorIds = (req.body.vendor_ids || []).filter((vendorId) => activeIds.has(vendorId));
    const vendorIds = selectedVendorIds.length ? selectedVendorIds : activeVendors.slice(0, 2).map((vendor) => vendor.id);

    if (vendorIds.length) {
      await trx('rfq_vendor_assignments').insert(vendorIds.map((vendorId) => ({
        id: crypto.randomUUID(),
        rfq_id: id,
        vendor_id: vendorId,
        invited_at: now,
        status: 'invited',
      })));
    }

    await trx.commit();
    res.status(201).json({ id, rfq_number: rfqNumber, ...req.body, line_items: lineItems, vendor_ids: vendorIds });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
});

app.get('/api/quotations', async (_req, res, next) => {
  try {
    const rows = await db('quotations')
      .select(
        'quotations.*',
        'vendors.vendor_name',
        'vendors.rating',
        'rfqs.title as rfq_title'
      )
      .leftJoin('vendors', 'quotations.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'quotations.rfq_id', 'rfqs.id')
      .orderBy('quotations.created_at', 'desc');

    const ids = rows.map((row) => row.id);
    const lineItems = ids.length ? await db('quotation_line_items').whereIn('quotation_id', ids) : [];
    const linesByQuotation = lineItems.reduce((acc, item) => {
      acc[item.quotation_id] ||= [];
      acc[item.quotation_id].push(item);
      return acc;
    }, {});

    res.json(rows.map((row) => {
      const lines = linesByQuotation[row.id] || [];
      return {
        ...row,
        line_items: lines,
        delivery_days: Math.max(...lines.map((item) => Number(item.delivery_days || 0)), 0),
      };
    }));
  } catch (err) {
    next(err);
  }
});

app.post('/api/quotations', async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const rfq = await trx('rfqs').where({ status: 'published' }).first();
    const vendor = await trx('vendors').where({ status: 'active' }).first();
    if (!rfq || !vendor) {
      await trx.rollback();
      return res.status(400).json({ success: false, error: 'A published RFQ and active vendor are required.' });
    }

    const rfqLineItems = await trx('rfq_line_items').where({ rfq_id: rfq.id }).orderBy('created_at');
    const countResult = await trx('quotations').count('id as count').first();
    const quotationNumber = `QT-2026-${String(Number(countResult.count || 0) + 1).padStart(4, '0')}`;
    const id = crypto.randomUUID();
    const now = new Date();
    const requestLines = req.body.line_items || [];
    const subtotal = requestLines.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
    const gstPercentage = Number(req.body.gst_percentage || 18);
    const gstAmount = subtotal * (gstPercentage / 100);

    await trx('quotations').insert({
      id,
      quotation_number: quotationNumber,
      rfq_id: rfq.id,
      vendor_id: vendor.id,
      subtotal: subtotal.toFixed(2),
      gst_percentage: gstPercentage.toFixed(2),
      gst_amount: gstAmount.toFixed(2),
      grand_total: (subtotal + gstAmount).toFixed(2),
      payment_terms: req.body.payment_terms || 'Net 30',
      notes: req.body.notes || null,
      status: 'submitted',
      submitted_at: now,
      created_at: now,
      updated_at: now,
    });

    const lineRecords = requestLines.map((item, index) => ({
      id: crypto.randomUUID(),
      quotation_id: id,
      rfq_line_item_id: rfqLineItems[index % Math.max(rfqLineItems.length, 1)]?.id || rfqLineItems[0]?.id,
      item_name: item.item_name,
      quantity: Number(item.quantity || 1).toFixed(2),
      unit_price: Number(item.unit_price || 0).toFixed(2),
      total_price: (Number(item.quantity || 1) * Number(item.unit_price || 0)).toFixed(2),
      delivery_days: Number(item.delivery_days || 0),
    })).filter((item) => item.rfq_line_item_id);
    if (lineRecords.length) await trx('quotation_line_items').insert(lineRecords);

    await trx.commit();
    res.status(201).json({ id, quotation_number: quotationNumber, line_items: lineRecords });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
});

app.get('/api/approvals', async (_req, res, next) => {
  try {
    const approval = await db('approvals')
      .select('approvals.*')
      .where({ status: 'pending' })
      .orderBy('created_at', 'desc')
      .first()
      || await db('approvals').orderBy('created_at', 'desc').first();

    if (!approval) return res.json({ items: [] });

    const steps = await db('approval_steps')
      .select(
        'approval_steps.*',
        db.raw("concat(users.first_name, ' ', users.last_name) as approver_name"),
        'users.role as approver_role'
      )
      .leftJoin('users', 'approval_steps.approver_id', 'users.id')
      .where({ approval_id: approval.id })
      .orderBy('step_number');
    const currentStep = steps.find((step) => step.step_number === approval.current_step) || steps.find((step) => step.status === 'pending') || steps[0];

    res.json({
      items: [{
        ...approval,
        steps,
        current_step_id: currentStep?.id,
      }],
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/approvals/:id/steps/:stepId/:action', async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { id, stepId, action } = req.params;
    if (!['approve', 'reject'].includes(action)) {
      await trx.rollback();
      return res.status(400).json({ success: false, error: 'Unsupported approval action.' });
    }

    const approval = await trx('approvals').where({ id }).first();
    const step = await trx('approval_steps').where({ id: stepId, approval_id: id }).first();
    if (!approval || !step) {
      await trx.rollback();
      return res.status(404).json({ success: false, error: 'Approval step not found.' });
    }

    const now = new Date();
    const stepStatus = action === 'reject' ? 'rejected' : 'approved';
    await trx('approval_steps').where({ id: stepId, approval_id: id }).update({
      status: stepStatus,
      remarks: req.body?.remarks || null,
      acted_at: now,
    });

    if (action === 'reject') {
      await trx('approvals').where({ id }).update({ status: 'rejected', updated_at: now });
      await trx('quotations').where({ id: approval.quotation_id }).update({ status: 'rejected', updated_at: now });
    } else {
      const nextStep = await trx('approval_steps')
        .where({ approval_id: id })
        .where('step_number', '>', step.step_number)
        .orderBy('step_number')
        .first();

      if (nextStep) {
        await trx('approval_steps').where({ id: nextStep.id }).update({ status: 'pending' });
        await trx('approvals').where({ id }).update({ current_step: nextStep.step_number, updated_at: now });
      } else {
        await trx('approvals').where({ id }).update({ status: 'approved', current_step: 4, updated_at: now });
        await trx('quotations').where({ id: approval.quotation_id }).update({ status: 'selected', updated_at: now });
      }
    }

    await trx('activity_logs').insert({
      id: crypto.randomUUID(),
      entity_type: 'approval',
      entity_id: id,
      action: action === 'approve' ? `Approval step approved: ${step.step_name}` : `Approval step rejected: ${step.step_name}`,
      performed_by: step.approver_id,
      metadata: { step_number: step.step_number, action },
      created_at: now,
    });

    await trx.commit();
    const updatedApproval = await db('approvals').where({ id }).first();
    res.json({ success: true, approval: updatedApproval, id, stepId, action });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
});

app.get('/api/reports/dashboard-stats', async (_req, res, next) => {
  try {
    const [activeRFQs] = await db('rfqs').where({ status: 'published' }).count('id as count');
    const [pendingApprovals] = await db('approvals').where({ status: 'pending' }).count('id as count');
    const [overdueInvoices] = await db('invoices').where({ status: 'overdue' }).count('id as count');

    const [poThisMonth] = await db('purchase_orders')
      .whereRaw("po_date >= date_trunc('month', current_date)")
      .count('id as count')
      .sum('grand_total as total');

    const recentPOs = await db('purchase_orders')
      .select(
        'purchase_orders.id',
        'purchase_orders.po_number',
        'purchase_orders.grand_total',
        'purchase_orders.po_date',
        'purchase_orders.status',
        'vendors.vendor_name',
        'rfqs.title as rfq_title',
        'invoices.id as invoice_id'
      )
      .leftJoin('vendors', 'purchase_orders.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'purchase_orders.rfq_id', 'rfqs.id')
      .leftJoin('invoices', 'invoices.po_id', 'purchase_orders.id')
      .orderBy('purchase_orders.created_at', 'desc')
      .limit(5);

    res.json({
      stats: {
        active_rfqs: Number(activeRFQs.count || 0),
        pending_approvals: Number(pendingApprovals.count || 0),
        po_this_month_count: Number(poThisMonth.count || 0),
        po_this_month_total: Number(poThisMonth.total || 0),
        overdue_invoices: Number(overdueInvoices.count || 0),
      },
      recent_pos: recentPOs,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/reports/spending-summary', async (_req, res, next) => {
  try {
    const rows = await db('purchase_orders')
      .select(
        db.raw("to_char(date_trunc('month', po_date), 'Mon YYYY') as month"),
        db.raw("date_trunc('month', po_date) as month_date"),
        db.raw('sum(grand_total) as total')
      )
      .groupByRaw("date_trunc('month', po_date)")
      .orderByRaw("date_trunc('month', po_date) desc")
      .limit(6);

    res.json({
      spending_summary: rows
        .reverse()
        .map((row) => ({
          month: row.month,
          month_date: row.month_date,
          total: Number(row.total || 0),
        })),
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/purchase-orders', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 50);
    const rows = await db('purchase_orders')
      .select(
        'purchase_orders.id',
        'purchase_orders.po_number',
        'purchase_orders.grand_total',
        'purchase_orders.po_date',
        'purchase_orders.status',
        'vendors.vendor_name',
        'rfqs.title as rfq_title',
        'invoices.id as invoice_id'
      )
      .leftJoin('vendors', 'purchase_orders.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'purchase_orders.rfq_id', 'rfqs.id')
      .leftJoin('invoices', 'invoices.po_id', 'purchase_orders.id')
      .orderBy('purchase_orders.created_at', 'desc')
      .limit(limit);

    res.json({ purchase_orders: rows });
  } catch (err) {
    next(err);
  }
});

app.get('/api/invoices', async (_req, res, next) => {
  try {
    const invoice = await db('invoices')
      .select(
        'invoices.*',
        'vendors.vendor_name',
        'vendors.address as vendor_address',
        'vendors.gst_number as vendor_gstin',
        'purchase_orders.po_number',
        'purchase_orders.po_date',
        'purchase_orders.quotation_id'
      )
      .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
      .leftJoin('purchase_orders', 'invoices.po_id', 'purchase_orders.id')
      .orderByRaw("case invoices.status when 'pending_payment' then 0 when 'overdue' then 1 else 2 end")
      .orderBy('invoices.created_at', 'desc')
      .first();

    if (!invoice) return res.json({ items: [] });

    const items = await db('quotation_line_items').where({ quotation_id: invoice.quotation_id });

    res.json({
      items: [{
        ...invoice,
        bill_to_name: 'VendorBridge Organization',
        bill_to_address: '123 Business Park, Mumbai',
        bill_to_gstin: '27AABCV1234M1ZX',
        items,
      }],
    });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/invoices/:id/mark-paid', async (req, res, next) => {
  try {
    const now = new Date();
    await db('invoices').where({ id: req.params.id }).update({
      status: 'paid',
      paid_at: now,
      updated_at: now,
    });
    const invoice = await db('invoices').where({ id: req.params.id }).first();
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

app.post('/api/invoices/:id/email', async (req, res, next) => {
  try {
    const invoice = await db('invoices')
      .select('invoices.*', 'vendors.email as vendor_email', 'vendors.vendor_name')
      .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
      .where('invoices.id', req.params.id)
      .first();

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found.' });
    }

    const actor = await db('users').where({ role: 'admin' }).first();
    await db('activity_logs').insert({
      id: crypto.randomUUID(),
      entity_type: 'invoice',
      entity_id: invoice.id,
      action: `Invoice emailed: ${invoice.invoice_number}`,
      performed_by: actor?.id || null,
      metadata: {
        invoice_number: invoice.invoice_number,
        vendor: invoice.vendor_name,
        to: invoice.vendor_email,
      },
      created_at: new Date(),
    });

    res.json({
      success: true,
      message: `Invoice ${invoice.invoice_number} emailed to ${invoice.vendor_email}.`,
      to: invoice.vendor_email,
      preview_url: `mailto:${invoice.vendor_email}?subject=Invoice ${invoice.invoice_number}`,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/reports/vendor-performance', async (req, res, next) => {
  try {
    const range = monthRange(req.query.month);
    const rows = await db('vendors')
      .select(
        'vendors.id',
        'vendors.vendor_name',
        'vendors.category',
        'vendors.rating',
        db.raw('count(distinct purchase_orders.id) as total_pos'),
        db.raw('coalesce(sum(purchase_orders.grand_total), 0) as total_spend')
      )
      .leftJoin('purchase_orders', function joinPOs() {
        this.on('purchase_orders.vendor_id', 'vendors.id');
        if (range) {
          this.andOn('purchase_orders.po_date', '>=', db.raw('?', [range.start]))
            .andOn('purchase_orders.po_date', '<', db.raw('?', [range.end]));
        }
      })
      .groupBy('vendors.id')
      .orderBy('total_spend', 'desc');

    res.json({
      vendor_performance: rows.map((row) => ({
        ...row,
        total_pos: Number(row.total_pos || 0),
        total_spend: Number(row.total_spend || 0),
      })),
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/reports/procurement-stats', async (req, res, next) => {
  try {
    const range = monthRange(req.query.month);
    const rfqQuery = db('rfqs').count('id as count');
    const poQuery = db('purchase_orders').count('id as count');
    const invoiceQuery = db('invoices').sum('grand_total as total').count('id as count');

    if (range) {
      rfqQuery.where('created_at', '>=', range.start).where('created_at', '<', range.end);
      poQuery.where('po_date', '>=', range.start).where('po_date', '<', range.end);
      invoiceQuery.where('invoice_date', '>=', range.start).where('invoice_date', '<', range.end);
    }

    const [rfqCount] = await rfqQuery;
    const [poCount] = await poQuery;
    const [invoiceStats] = await invoiceQuery;
    const [vendorCount] = await db('vendors').where({ status: 'active' }).count('id as count');

    res.json({
      procurement_stats: {
        total_rfqs: Number(rfqCount.count || 0),
        total_pos: Number(poCount.count || 0),
        total_invoice_value: Number(invoiceStats.total || 0),
        total_invoices: Number(invoiceStats.count || 0),
        active_vendors: Number(vendorCount.count || 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/activity', async (req, res, next) => {
  try {
    const { entity_type } = req.query;
    let query = db('activity_logs').select('*').orderBy('created_at', 'desc').limit(50);
    if (entity_type) query = query.where({ entity_type });
    const rows = await query;
    const toneByType = {
      rfq: 'blue',
      approval: 'gold',
      invoice: 'green',
      vendor: 'rose',
      user: 'blue',
      quotation: 'gold',
      purchase_order: 'green',
    };

    res.json(rows.map((row) => ({
      ...row,
      tone: toneByType[row.entity_type] || 'blue',
    })));
  } catch (err) {
    next(err);
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

app.use(errorHandler);

module.exports = app;
