const db = require('../../config/db');

// GET /api/reports/dashboard-stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [activeRFQs] = await db('rfqs').where({ status: 'published' }).count('id as count');
    const [pendingApprovals] = await db('approvals').where({ status: 'pending' }).count('id as count');
    const [overdueInvoices] = await db('invoices').where({ status: 'overdue' }).count('id as count');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [poThisMonth] = await db('purchase_orders')
      .where('po_date', '>=', monthStart)
      .sum('grand_total as total')
      .count('id as count');

    const recentPOs = await db('purchase_orders')
      .select('purchase_orders.*', 'vendors.vendor_name', 'rfqs.rfq_number')
      .leftJoin('vendors', 'purchase_orders.vendor_id', 'vendors.id')
      .leftJoin('rfqs', 'purchase_orders.rfq_id', 'rfqs.id')
      .orderBy('purchase_orders.created_at', 'desc')
      .limit(5);

    res.json({
      stats: {
        active_rfqs: parseInt(activeRFQs.count),
        pending_approvals: parseInt(pendingApprovals.count),
        overdue_invoices: parseInt(overdueInvoices.count),
        po_this_month_count: parseInt(poThisMonth.count),
        po_this_month_total: parseFloat(poThisMonth.total) || 0,
      },
      recent_pos: recentPOs,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/spending-summary
const getSpendingSummary = async (req, res, next) => {
  try {
    const rows = await db('purchase_orders')
      .select(
        db.raw("TO_CHAR(DATE_TRUNC('month', po_date), 'Mon YYYY') as month"),
        db.raw("DATE_TRUNC('month', po_date) as month_date"),
        db.raw('SUM(grand_total) as total')
      )
      .groupByRaw("DATE_TRUNC('month', po_date)")
      .orderByRaw("DATE_TRUNC('month', po_date) DESC")
      .limit(6);

    res.json({ spending_summary: rows.reverse() });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/vendor-performance
const getVendorPerformance = async (req, res, next) => {
  try {
    const rows = await db('vendors')
      .select(
        'vendors.id',
        'vendors.vendor_name',
        'vendors.category',
        'vendors.rating',
        'vendors.status',
        db.raw('COUNT(DISTINCT purchase_orders.id) as total_pos'),
        db.raw('COALESCE(SUM(purchase_orders.grand_total), 0) as total_spend')
      )
      .leftJoin('purchase_orders', 'purchase_orders.vendor_id', 'vendors.id')
      .groupBy('vendors.id')
      .orderBy('total_spend', 'desc');

    res.json({ vendor_performance: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/procurement-stats
const getProcurementStats = async (req, res, next) => {
  try {
    const [rfqCount] = await db('rfqs').count('id as count');
    const [poCount] = await db('purchase_orders').count('id as count');
    const [invoiceStats] = await db('invoices').sum('grand_total as total').count('id as count');
    const [vendorCount] = await db('vendors').where({ status: 'active' }).count('id as count');

    res.json({
      procurement_stats: {
        total_rfqs: parseInt(rfqCount.count),
        total_pos: parseInt(poCount.count),
        total_invoice_value: parseFloat(invoiceStats.total) || 0,
        total_invoices: parseInt(invoiceStats.count),
        active_vendors: parseInt(vendorCount.count),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats, getSpendingSummary, getVendorPerformance, getProcurementStats };
