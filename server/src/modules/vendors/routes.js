const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createVendorSchema, updateVendorSchema, updateStatusSchema } = require('./schema');
const {
  getAllVendors,
  createVendor,
  getVendorById,
  updateVendor,
  updateVendorStatus,
} = require('./controller');

router.use(auth);

router.get('/', getAllVendors);
router.post('/', requireRole('admin', 'procurement_officer'), validate(createVendorSchema), createVendor);
router.get('/:id', getVendorById);
router.patch('/:id', requireRole('admin', 'procurement_officer'), validate(updateVendorSchema), updateVendor);
router.patch('/:id/status', requireRole('admin', 'procurement_officer'), validate(updateStatusSchema), updateVendorStatus);

module.exports = router;
