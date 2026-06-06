exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE assignment_status AS ENUM ('invited', 'submitted', 'declined');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('rfq_vendor_assignments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('rfq_id').notNullable().references('id').inTable('rfqs').onDelete('CASCADE');
    t.uuid('vendor_id').notNullable().references('id').inTable('vendors').onDelete('CASCADE');
    t.timestamp('invited_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.specificType('status', 'assignment_status').notNullable().defaultTo('invited');
    t.unique(['rfq_id', 'vendor_id']);
    t.index('rfq_id');
    t.index('vendor_id');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('rfq_vendor_assignments');
  await knex.raw('DROP TYPE IF EXISTS assignment_status;');
};
