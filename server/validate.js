/**
 * validate(schema) — returns Express middleware that parses req.body
 * against the provided Zod schema.
 *
 * On failure: returns 400 with structured field-level errors.
 * On success: attaches parsed+coerced data to req.body and calls next().
 *
 * Usage:
 *   router.post('/', validate(createVendorSchema), controller.create);
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field:   e.path.join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        error:   'Validation failed.',
        errors,
      });
    }

    // Replace req.body with the parsed (coerced + stripped) data
    req.body = result.data;
    next();
  };
}

module.exports = validate;
