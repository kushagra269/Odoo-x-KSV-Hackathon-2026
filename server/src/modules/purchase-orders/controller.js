const db = require('../../config/db');

// GET /api/purchase-orders
const getAllPOs = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = db('purchase_orders')
      .select(
        'purchase_orders.*',
        'vendors.vendor_name',
        'vendors.email as vendor_email',
        'rfqs.title as rfq_title',
        'rfqs.rfq_number',
        'invoices.id as invoice_id',
        'invoices.invoice_number',
        'invoices.status as invoice_status'
      )
      .leftJoin('vendors', 'purchase_orders.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'purchase_orders.rfq_id', 'rfqs.id')
      .leftJoin('invoices', 'invoices.po_id', 'purchase_orders.id')
      .orderBy('purchase_orders.created_at', 'desc');

    if (status) query = query.where('purchase_orders.status', status);

    const pos = await query;
    res.json({ purchase_orders: pos });
  } catch (err) {
    next(err);
  }
};

// GET /api/purchase-orders/:id
const getPOById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const po = await db('purchase_orders')
      .select(
        'purchase_orders.*',
        'vendors.vendor_name',
        'vendors.email as vendor_email',
        'vendors.address as vendor_address',
        'vendors.gst_number as vendor_gst',
        'vendors.contact_name',
        'vendors.contact_number',
        'rfqs.title as rfq_title',
        'rfqs.rfq_number'
      )
      .leftJoin('vendors', 'purchase_orders.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'purchase_orders.rfq_id', 'rfqs.id')
      .where('purchase_orders.id', id)
      .first();

    if (!po) return res.status(404).json({ error: 'Purchase order not found' });

    const line_items = await db('quotation_line_items')
      .where({ quotation_id: po.quotation_id });

    const invoice = await db('invoices').where({ po_id: id }).first();

    res.json({ purchase_order: po, line_items, invoice });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllPOs, getPOById };
