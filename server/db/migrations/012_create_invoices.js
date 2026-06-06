exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE invoice_status AS ENUM ('pending_payment', 'paid', 'overdue');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('invoices', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('invoice_number', 50).notNullable().unique();
    t.uuid('po_id').notNullable().references('id').inTable('purchase_orders').onDelete('RESTRICT');
    t.uuid('vendor_id').notNullable().references('id').inTable('vendors').onDelete('RESTRICT');
    t.date('invoice_date').notNullable();
    t.date('due_date').notNullable();
    t.decimal('subtotal', 12, 2).notNullable();
    t.decimal('cgst_amount', 12, 2).notNullable();
    t.decimal('sgst_amount', 12, 2).notNullable();
    t.decimal('grand_total', 12, 2).notNullable();
    t.specificType('status', 'invoice_status').notNullable().defaultTo('pending_payment');
    t.timestamp('paid_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('po_id');
    t.index('vendor_id');
    t.index('status');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('invoices');
  await knex.raw('DROP TYPE IF EXISTS invoice_status;');
};
