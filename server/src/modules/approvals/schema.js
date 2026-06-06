const { z } = require('zod');

const initiateApprovalSchema = z.object({
  quotation_id: z.string().uuid('Invalid quotation ID'),
  rfq_id: z.string().uuid('Invalid RFQ ID'),
  vendor_id: z.string().uuid('Invalid vendor ID'),
});

const stepActionSchema = z.object({
  remarks: z.string().optional(),
});

module.exports = { initiateApprovalSchema, stepActionSchema };
