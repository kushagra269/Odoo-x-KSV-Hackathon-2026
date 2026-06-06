const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { initiateApprovalSchema, stepActionSchema } = require('./schema');
const {
  getAllApprovals,
  initiateApproval,
  getApprovalById,
  approveStep,
  rejectStep,
} = require('./controller');

router.use(auth);

router.get('/', getAllApprovals);
router.post('/', requireRole('admin', 'procurement_officer', 'manager'), validate(initiateApprovalSchema), initiateApproval);
router.get('/:id', getApprovalById);
router.post('/:id/steps/:stepId/approve', requireRole('admin', 'manager'), validate(stepActionSchema), approveStep);
router.post('/:id/steps/:stepId/reject', requireRole('admin', 'manager'), validate(stepActionSchema), rejectStep);

module.exports = router;
