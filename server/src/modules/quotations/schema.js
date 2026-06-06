const { z } = require('zod');

const submitQuotationSchema = z.object({
  rfq_id: z.string().uuid('Invalid RFQ ID'),
  line_items: z.array(z.object({
    rfq_line_item_id: z.string().uuid(),
    item_name: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().positive('Unit price must be positive'),
    delivery_days: z.number().int().positive('Delivery days must be a positive integer'),
  })).min(1, 'At least one line item is required'),
  gst_percentage: z.number().min(0).max(100),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

const updateQuotationSchema = z.object({
  gst_percentage: z.number().min(0).max(100).optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

module.exports = { submitQuotationSchema, updateQuotationSchema };
