exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE rfq_status AS ENUM ('draft', 'published', 'closed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('rfqs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('rfq_number', 50).notNullable().unique();
    t.string('title', 255).notNullable();
    t.string('category', 100).notNullable();
    t.text('description').notNullable();
    t.date('deadline').notNullable();
    t.specificType('status', 'rfq_status').notNullable().defaultTo('draft');
    t.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('created_by');
    t.index('status');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('rfqs');
  await knex.raw('DROP TYPE IF EXISTS rfq_status;');
};
