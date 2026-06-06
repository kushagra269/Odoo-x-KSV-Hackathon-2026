exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE quotation_status AS ENUM ('draft', 'submitted', 'selected', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('quotations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('quotation_number', 50).notNullable().unique();
    t.uuid('rfq_id').notNullable().references('id').inTable('rfqs').onDelete('RESTRICT');
    t.uuid('vendor_id').notNullable().references('id').inTable('vendors').onDelete('RESTRICT');
    t.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    t.decimal('gst_percentage', 5, 2).notNullable().defaultTo(18);
    t.decimal('gst_amount', 12, 2).notNullable().defaultTo(0);
    t.decimal('grand_total', 12, 2).notNullable().defaultTo(0);
    t.string('payment_terms', 255);
    t.text('notes');
    t.specificType('status', 'quotation_status').notNullable().defaultTo('draft');
    t.timestamp('submitted_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('rfq_id');
    t.index('vendor_id');
    t.index('status');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('quotations');
  await knex.raw('DROP TYPE IF EXISTS quotation_status;');
};
