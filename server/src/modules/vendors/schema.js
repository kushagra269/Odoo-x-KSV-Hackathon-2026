const { z } = require('zod');

const createVendorSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required'),
  category: z.string().min(1, 'Category is required'),
  gst_number: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format'
    ),
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_number: z.string().min(10, 'Contact number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  address: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

const updateVendorSchema = createVendorSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'blocked'], {
    errorMap: () => ({ message: 'Status must be active, pending, or blocked' }),
  }),
});

module.exports = { createVendorSchema, updateVendorSchema, updateStatusSchema };
