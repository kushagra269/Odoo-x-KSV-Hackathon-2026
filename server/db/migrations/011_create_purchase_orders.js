exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE po_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('purchase_orders', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('po_number', 50).notNullable().unique();
    t.uuid('rfq_id').notNullable().references('id').inTable('rfqs').onDelete('RESTRICT');
    t.uuid('quotation_id').notNullable().references('id').inTable('quotations').onDelete('RESTRICT');
    t.uuid('vendor_id').notNullable().references('id').inTable('vendors').onDelete('RESTRICT');
    t.uuid('approval_id').notNullable().references('id').inTable('approvals').onDelete('RESTRICT');
    t.decimal('subtotal', 12, 2).notNullable();
    t.decimal('cgst_percentage', 5, 2).notNullable().defaultTo(9);
    t.decimal('sgst_percentage', 5, 2).notNullable().defaultTo(9);
    t.decimal('cgst_amount', 12, 2).notNullable();
    t.decimal('sgst_amount', 12, 2).notNullable();
    t.decimal('grand_total', 12, 2).notNullable();
    t.date('po_date').notNullable();
    t.specificType('status', 'po_status').notNullable().defaultTo('active');
    t.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('vendor_id');
    t.index('status');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('purchase_orders');
  await knex.raw('DROP TYPE IF EXISTS po_status;');
};
