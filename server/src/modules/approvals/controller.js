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

async function generatePONumber() {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const last = await db('purchase_orders')
    .where('po_number', 'like', `${prefix}%`)
    .orderBy('po_number', 'desc')
    .first();
  if (!last) return `${prefix}0001`;
  const lastNum = parseInt(last.po_number.split('-')[2]) || 0;
  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await db('invoices')
    .where('invoice_number', 'like', `${prefix}%`)
    .orderBy('invoice_number', 'desc')
    .first();
  if (!last) return `${prefix}0001`;
  const lastNum = parseInt(last.invoice_number.split('-')[2]) || 0;
  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
}

async function autoCreatePO(approval, trx) {
  const quotation = await trx('quotations').where({ id: approval.quotation_id }).first();
  const lineItems = await trx('quotation_line_items').where({ quotation_id: quotation.id });

  const subtotal = parseFloat(quotation.subtotal);
  const cgst_percentage = 9;
  const sgst_percentage = 9;
  const cgst_amount = parseFloat((subtotal * cgst_percentage / 100).toFixed(2));
  const sgst_amount = parseFloat((subtotal * sgst_percentage / 100).toFixed(2));
  const grand_total = parseFloat((subtotal + cgst_amount + sgst_amount).toFixed(2));

  const po_id = uuidv4();
  const now = new Date();
  const po_number = await generatePONumber();

  await trx('purchase_orders').insert({
    id: po_id,
    po_number,
    rfq_id: approval.rfq_id,
    quotation_id: quotation.id,
    vendor_id: approval.vendor_id,
    approval_id: approval.id,
    subtotal,
    cgst_percentage,
    sgst_percentage,
    cgst_amount,
    sgst_amount,
    grand_total,
    po_date: now,
    status: 'active',
    created_by: approval.initiated_by,
    created_at: now,
    updated_at: now,
  });

  // Auto-create invoice
  const invoice_id = uuidv4();
  const invoice_number = await generateInvoiceNumber();
  const due_date = new Date(now);
  due_date.setDate(due_date.getDate() + 30);

  await trx('invoices').insert({
    id: invoice_id,
    invoice_number,
    po_id,
    vendor_id: approval.vendor_id,
    invoice_date: now,
    due_date,
    subtotal,
    cgst_amount,
    sgst_amount,
    grand_total,
    status: 'pending_payment',
    paid_at: null,
    created_at: now,
    updated_at: now,
  });

  logger.info(`Auto-created PO ${po_number} and Invoice ${invoice_number}`);
  return { po_id, po_number, invoice_id, invoice_number };
}

// GET /api/approvals
const getAllApprovals = async (req, res, next) => {
  try {
    const approvals = await db('approvals')
      .select(
        'approvals.*',
        'quotations.quotation_number',
        'quotations.grand_total',
        'vendors.vendor_name',
        'rfqs.title as rfq_title',
        'rfqs.rfq_number',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as initiated_by_name")
      )
      .leftJoin('quotations', 'approvals.quotation_id', 'quotations.id')
      .leftJoin('vendors', 'approvals.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'approvals.rfq_id', 'rfqs.id')
      .leftJoin('users', 'approvals.initiated_by', 'users.id')
      .orderBy('approvals.created_at', 'desc');

    res.json({ approvals });
  } catch (err) {
    next(err);
  }
};

// POST /api/approvals
const initiateApproval = async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { quotation_id, rfq_id, vendor_id } = req.body;

    // Validate quotation exists and is submitted
    const quotation = await trx('quotations').where({ id: quotation_id }).first();
    if (!quotation) { await trx.rollback(); return res.status(404).json({ error: 'Quotation not found' }); }
    if (quotation.status !== 'submitted') {
      await trx.rollback();
      return res.status(400).json({ error: 'Only submitted quotations can be approved' });
    }

    // Find manager for L1 and admin for L2
    const l1Approver = await trx('users').where({ role: 'manager', is_active: true }).first();
    const l2Approver = await trx('users').where({ role: 'admin', is_active: true }).first();

    if (!l1Approver || !l2Approver) {
      await trx.rollback();
      return res.status(400).json({ error: 'No manager or admin found to assign approval steps' });
    }

    const approval_id = uuidv4();
    const now = new Date();

    await trx('approvals').insert({
      id: approval_id,
      quotation_id,
      rfq_id,
      vendor_id,
      current_step: 1,
      status: 'pending',
      initiated_by: req.user.id,
      created_at: now,
      updated_at: now,
    });

    // Create L1 and L2 steps
    await trx('approval_steps').insert([
      {
        id: uuidv4(),
        approval_id,
        step_number: 2,
        step_name: 'L1 Review',
        approver_id: l1Approver.id,
        status: 'pending',
        remarks: null,
        acted_at: null,
        assigned_at: now,
      },
      {
        id: uuidv4(),
        approval_id,
        step_number: 3,
        step_name: 'L2 Approval',
        approver_id: l2Approver.id,
        status: 'awaiting',
        remarks: null,
        acted_at: null,
        assigned_at: now,
      },
    ]);

    // Mark quotation as selected
    await trx('quotations').where({ id: quotation_id }).update({
      status: 'selected',
      updated_at: now,
    });

    await trx.commit();

    await logActivity('approval', approval_id, `Approval workflow initiated for quotation ${quotation.quotation_number}`, req.user.id, {
      quotation_id,
      vendor_id,
      l1_approver: l1Approver.id,
      l2_approver: l2Approver.id,
    });

    const created = await db('approvals').where({ id: approval_id }).first();
    res.status(201).json({ approval: created });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

// GET /api/approvals/:id
const getApprovalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const approval = await db('approvals')
      .select(
        'approvals.*',
        'quotations.quotation_number',
        'quotations.grand_total',
        'quotations.gst_percentage',
        'quotations.payment_terms',
        'vendors.vendor_name',
        'vendors.rating as vendor_rating',
        'rfqs.title as rfq_title',
        'rfqs.rfq_number',
        db.raw("CONCAT(u.first_name, ' ', u.last_name) as initiated_by_name")
      )
      .leftJoin('quotations', 'approvals.quotation_id', 'quotations.id')
      .leftJoin('vendors', 'approvals.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'approvals.rfq_id', 'rfqs.id')
      .leftJoin('users as u', 'approvals.initiated_by', 'u.id')
      .where('approvals.id', id)
      .first();

    if (!approval) return res.status(404).json({ error: 'Approval not found' });

    const steps = await db('approval_steps')
      .select(
        'approval_steps.*',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as approver_name"),
        'users.role as approver_role',
        'users.email as approver_email'
      )
      .leftJoin('users', 'approval_steps.approver_id', 'users.id')
      .where({ approval_id: id })
      .orderBy('step_number');

    // Get quotation line items for summary
    const line_items = await db('quotation_line_items')
      .where({ quotation_id: approval.quotation_id });

    res.json({ approval, steps, line_items });
  } catch (err) {
    next(err);
  }
};

// POST /api/approvals/:id/steps/:stepId/approve
const approveStep = async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { id, stepId } = req.params;
    const { remarks } = req.body;

    const step = await trx('approval_steps').where({ id: stepId, approval_id: id }).first();
    if (!step) { await trx.rollback(); return res.status(404).json({ error: 'Step not found' }); }

    if (step.approver_id !== req.user.id) {
      await trx.rollback();
      return res.status(403).json({ error: 'You are not assigned to this step' });
    }
    if (step.status === 'approved') {
      await trx.rollback();
      return res.status(400).json({ error: 'Step already approved' });
    }

    const now = new Date();

    // Approve current step
    await trx('approval_steps').where({ id: stepId }).update({
      status: 'approved',
      remarks: remarks || null,
      acted_at: now,
    });

    // Get all steps for this approval
    const allSteps = await trx('approval_steps').where({ approval_id: id }).orderBy('step_number');
    const approval = await trx('approvals').where({ id }).first();

    // Activate next step if exists
    const currentIndex = allSteps.findIndex(s => s.id === stepId);
    const nextStep = allSteps[currentIndex + 1];

    let poResult = null;

    if (nextStep) {
      await trx('approval_steps').where({ id: nextStep.id }).update({ status: 'pending' });
      await trx('approvals').where({ id }).update({
        current_step: nextStep.step_number,
        updated_at: now,
      });
    } else {
      // All steps approved — finalize
      await trx('approvals').where({ id }).update({
        status: 'approved',
        current_step: 4,
        updated_at: now,
      });

      // Auto-create PO + Invoice
      poResult = await autoCreatePO({ ...approval, id }, trx);

      await logActivity('approval', id, `Approval fully approved — PO ${poResult.po_number} created`, req.user.id, poResult);
    }

    await trx.commit();

    await logActivity('approval', id, `Step "${step.step_name}" approved`, req.user.id, { remarks, step_number: step.step_number });

    const updatedApproval = await db('approvals').where({ id }).first();
    res.json({ approval: updatedApproval, po: poResult });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

// POST /api/approvals/:id/steps/:stepId/reject
const rejectStep = async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const { id, stepId } = req.params;
    const { remarks } = req.body;

    const step = await trx('approval_steps').where({ id: stepId, approval_id: id }).first();
    if (!step) { await trx.rollback(); return res.status(404).json({ error: 'Step not found' }); }

    if (step.approver_id !== req.user.id) {
      await trx.rollback();
      return res.status(403).json({ error: 'You are not assigned to this step' });
    }

    const now = new Date();

    await trx('approval_steps').where({ id: stepId }).update({
      status: 'rejected',
      remarks: remarks || null,
      acted_at: now,
    });

    await trx('approvals').where({ id }).update({
      status: 'rejected',
      updated_at: now,
    });

    // Revert quotation to submitted
    const approval = await trx('approvals').where({ id }).first();
    await trx('quotations').where({ id: approval.quotation_id }).update({
      status: 'rejected',
      updated_at: now,
    });

    await trx.commit();

    await logActivity('approval', id, `Step "${step.step_name}" rejected`, req.user.id, { remarks });

    const updatedApproval = await db('approvals').where({ id }).first();
    res.json({ approval: updatedApproval });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

module.exports = { getAllApprovals, initiateApproval, getApprovalById, approveStep, rejectStep };
