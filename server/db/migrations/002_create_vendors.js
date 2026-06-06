exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE vendor_status AS ENUM ('active', 'pending', 'blocked');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('vendors', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.string('vendor_name', 255).notNullable();
    t.string('category', 100).notNullable();
    t.string('gst_number', 20).notNullable().unique();
    t.string('contact_name', 100).notNullable();
    t.string('contact_number', 20).notNullable();
    t.string('email', 255).notNullable();
    t.text('address').notNullable();
    t.string('country', 100).notNullable();
    t.specificType('status', 'vendor_status').notNullable().defaultTo('pending');
    t.decimal('rating', 2, 1).notNullable().defaultTo(0);
    t.text('notes');
    t.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('user_id');
    t.index('created_by');
    t.index('status');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('vendors');
  await knex.raw('DROP TYPE IF EXISTS vendor_status;');
};
