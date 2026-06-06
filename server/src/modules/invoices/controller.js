const { v4: uuidv4 } = require('uuid');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
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

async function getFullInvoice(id) {
  const invoice = await db('invoices')
    .select(
      'invoices.*',
      'vendors.vendor_name',
      'vendors.email as vendor_email',
      'vendors.address as vendor_address',
      'vendors.gst_number as vendor_gst',
      'vendors.contact_name',
      'purchase_orders.po_number',
      'purchase_orders.po_date',
      'purchase_orders.quotation_id',
      'rfqs.title as rfq_title',
      'rfqs.rfq_number'
    )
    .leftJoin('purchase_orders', 'invoices.po_id', 'purchase_orders.id')
    .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
    .leftJoin('rfqs', 'purchase_orders.rfq_id', 'rfqs.id')
    .where('invoices.id', id)
    .first();
  return invoice;
}

// GET /api/invoices
const getAllInvoices = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = db('invoices')
      .select(
        'invoices.*',
        'vendors.vendor_name',
        'purchase_orders.po_number',
        'rfqs.title as rfq_title'
      )
      .leftJoin('purchase_orders', 'invoices.po_id', 'purchase_orders.id')
      .leftJoin('vendors', 'invoices.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'purchase_orders.rfq_id', 'rfqs.id')
      .orderBy('invoices.created_at', 'desc');

    if (status) query = query.where('invoices.status', status);

    const invoices = await query;
    res.json({ invoices });
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await getFullInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const line_items = await db('quotation_line_items')
      .where({ quotation_id: invoice.quotation_id });

    res.json({ invoice, line_items });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/mark-paid
const markPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('invoices').where({ id }).first();
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.status === 'paid') {
      return res.status(400).json({ error: 'Invoice already marked as paid' });
    }

    const now = new Date();
    await db('invoices').where({ id }).update({
      status: 'paid',
      paid_at: now,
      updated_at: now,
    });

    await logActivity('invoice', id, `Invoice ${existing.invoice_number} marked as paid`, req.user.id);

    const updated = await db('invoices').where({ id }).first();
    res.json({ invoice: updated });
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/:id/pdf
const downloadPDF = async (req, res, next) => {
  try {
    const invoice = await getFullInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const line_items = await db('quotation_line_items')
      .where({ quotation_id: invoice.quotation_id });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('VendorBridge', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Procurement & Vendor Management ERP', 50, 78);
    doc.fillColor('#000').fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`Invoice No: ${invoice.invoice_number}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' });
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, 400, 105, { align: 'right' });

    doc.moveTo(50, 125).lineTo(545, 125).stroke();

    // Bill To / Vendor
    doc.y = 140;
    doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 50);
    doc.font('Helvetica').text('VendorBridge Organization', 50);
    doc.text('123 Business Park, Mumbai', 50);
    doc.text('GST: 27AABCV1234M1ZX', 50);

    doc.fontSize(10).font('Helvetica-Bold').text('Vendor:', 320, 140);
    doc.font('Helvetica').text(invoice.vendor_name || '', 320);
    doc.text(invoice.vendor_address || '', 320);
    doc.text(`GST: ${invoice.vendor_gst || 'N/A'}`, 320);
    doc.text(`Email: ${invoice.vendor_email || ''}`, 320);

    doc.y = 230;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    // PO Reference
    doc.y += 10;
    doc.fontSize(10).font('Helvetica-Bold').text(`PO Number: `, 50, doc.y, { continued: true });
    doc.font('Helvetica').text(invoice.po_number || '');
    doc.font('Helvetica-Bold').text(`RFQ: `, 50, doc.y, { continued: true });
    doc.font('Helvetica').text(`${invoice.rfq_number} — ${invoice.rfq_title}`);

    doc.y += 20;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    // Line items table header
    doc.y += 10;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item', 50, doc.y);
    doc.text('Qty', 270, doc.y);
    doc.text('Unit Price', 320, doc.y);
    doc.text('Total', 430, doc.y);
    doc.y += 5;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.y += 8;

    doc.font('Helvetica').fontSize(9);
    line_items.forEach(item => {
      doc.text(item.item_name, 50, doc.y);
      doc.text(String(item.quantity), 270, doc.y);
      doc.text(`₹${parseFloat(item.unit_price).toLocaleString('en-IN')}`, 320, doc.y);
      doc.text(`₹${parseFloat(item.total_price).toLocaleString('en-IN')}`, 430, doc.y);
      doc.y += 20;
    });

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.y += 10;

    // Totals
    const subtotal = parseFloat(invoice.subtotal);
    const cgst = parseFloat(invoice.cgst_amount);
    const sgst = parseFloat(invoice.sgst_amount);
    const grand = parseFloat(invoice.grand_total);

    doc.fontSize(10);
    doc.text(`Subtotal:`, 350, doc.y); doc.text(`₹${subtotal.toLocaleString('en-IN')}`, 470, doc.y); doc.y += 18;
    doc.text(`CGST (9%):`, 350, doc.y); doc.text(`₹${cgst.toLocaleString('en-IN')}`, 470, doc.y); doc.y += 18;
    doc.text(`SGST (9%):`, 350, doc.y); doc.text(`₹${sgst.toLocaleString('en-IN')}`, 470, doc.y); doc.y += 18;
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Grand Total:`, 350, doc.y); doc.text(`₹${grand.toLocaleString('en-IN')}`, 470, doc.y);

    doc.y += 30;
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Status: ${invoice.status.replace('_', ' ').toUpperCase()}`, 50, doc.y);

    doc.end();
  } catch (err) {
    next(err);
  }
};

// POST /api/invoices/:id/email
const emailInvoice = async (req, res, next) => {
  try {
    const invoice = await getFullInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const info = await transporter.sendMail({
      from: '"VendorBridge ERP" <noreply@vendorbridge.com>',
      to: invoice.vendor_email || 'test@example.com',
      subject: `Invoice ${invoice.invoice_number} from VendorBridge`,
      html: `
        <h2>Invoice ${invoice.invoice_number}</h2>
        <p>Dear ${invoice.contact_name || invoice.vendor_name},</p>
        <p>Please find your invoice details below:</p>
        <table border="1" cellpadding="8" style="border-collapse:collapse">
          <tr><td><b>Invoice Number</b></td><td>${invoice.invoice_number}</td></tr>
          <tr><td><b>PO Number</b></td><td>${invoice.po_number}</td></tr>
          <tr><td><b>Invoice Date</b></td><td>${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</td></tr>
          <tr><td><b>Due Date</b></td><td>${new Date(invoice.due_date).toLocaleDateString('en-IN')}</td></tr>
          <tr><td><b>Grand Total</b></td><td>₹${parseFloat(invoice.grand_total).toLocaleString('en-IN')}</td></tr>
          <tr><td><b>Status</b></td><td>${invoice.status.replace('_', ' ').toUpperCase()}</td></tr>
        </table>
        <p>Thank you for your business.</p>
        <p>— VendorBridge Team</p>
      `,
    });

    await logActivity('invoice', invoice.id, `Invoice ${invoice.invoice_number} emailed to ${invoice.vendor_email}`, req.user.id);

    res.json({
      message: 'Invoice emailed successfully',
      preview_url: nodemailer.getTestMessageUrl(info),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllInvoices, getInvoiceById, markPaid, downloadPDF, emailInvoice };
