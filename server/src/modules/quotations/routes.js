const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { submitQuotationSchema, updateQuotationSchema } = require('./schema');
const {
  getAllQuotations,
  createQuotation,
  getQuotationById,
  updateQuotation,
  submitQuotation,
} = require('./controller');

router.use(auth);

router.get('/', getAllQuotations);
router.post('/', validate(submitQuotationSchema), createQuotation);
router.get('/:id', getQuotationById);
router.patch('/:id', validate(updateQuotationSchema), updateQuotation);
router.post('/:id/submit', submitQuotation);

module.exports = router;
