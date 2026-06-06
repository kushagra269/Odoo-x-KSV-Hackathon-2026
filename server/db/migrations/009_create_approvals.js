exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('approvals', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('quotation_id').notNullable().references('id').inTable('quotations').onDelete('RESTRICT');
    t.uuid('rfq_id').notNullable().references('id').inTable('rfqs').onDelete('RESTRICT');
    t.uuid('vendor_id').notNullable().references('id').inTable('vendors').onDelete('RESTRICT');
    t.integer('current_step').notNullable().defaultTo(1);
    t.specificType('status', 'approval_status').notNullable().defaultTo('pending');
    t.uuid('initiated_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('quotation_id');
    t.index('rfq_id');
    t.index('status');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('approvals');
  await knex.raw('DROP TYPE IF EXISTS approval_status;');
};
