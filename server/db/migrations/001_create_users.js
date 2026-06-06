exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('procurement_officer', 'vendor', 'manager', 'admin');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('email', 255).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.string('phone', 20);
    t.string('country', 100);
    t.specificType('role', 'user_role').notNullable().defaultTo('procurement_officer');
    t.text('profile_photo_url');
    t.text('additional_info');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_role;');
};
