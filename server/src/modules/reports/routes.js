const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const { getDashboardStats, getSpendingSummary, getVendorPerformance, getProcurementStats } = require('./controller');

router.use(auth);

router.get('/dashboard-stats', getDashboardStats);
router.get('/spending-summary', getSpendingSummary);
router.get('/vendor-performance', getVendorPerformance);
router.get('/procurement-stats', getProcurementStats);

module.exports = router;
