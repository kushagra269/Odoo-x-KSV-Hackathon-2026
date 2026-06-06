const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const { getAllInvoices, getInvoiceById, markPaid, downloadPDF, emailInvoice } = require('./controller');

router.use(auth);

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.patch('/:id/mark-paid', requireRole('admin', 'procurement_officer', 'manager'), markPaid);
router.get('/:id/pdf', downloadPDF);
router.post('/:id/email', emailInvoice);

module.exports = router;
