const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createRFQSchema, updateRFQSchema } = require('./schema');
const { getAllRFQs, createRFQ, getRFQById, updateRFQ, publishRFQ } = require('./controller');

router.use(auth);

router.get('/', getAllRFQs);
router.post('/', requireRole('admin', 'procurement_officer'), validate(createRFQSchema), createRFQ);
router.get('/:id', getRFQById);
router.patch('/:id', requireRole('admin', 'procurement_officer'), validate(updateRFQSchema), updateRFQ);
router.post('/:id/publish', requireRole('admin', 'procurement_officer'), publishRFQ);

module.exports = router;
