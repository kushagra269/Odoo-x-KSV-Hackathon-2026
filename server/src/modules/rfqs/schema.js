const { z } = require('zod');

const createRFQSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  line_items: z.array(z.object({
    item_name: z.string().min(1, 'Item name is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
  })).min(1, 'At least one line item is required'),
  vendor_ids: z.array(z.string().uuid()).min(1, 'At least one vendor must be assigned'),
});

const updateRFQSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

module.exports = { createRFQSchema, updateRFQSchema };
