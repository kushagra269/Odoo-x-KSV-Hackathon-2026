exports.up = async function (knex) {
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE step_status AS ENUM ('pending', 'approved', 'rejected', 'awaiting');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await knex.schema.createTable('approval_steps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('approval_id').notNullable().references('id').inTable('approvals').onDelete('CASCADE');
    t.integer('step_number').notNullable();
    t.string('step_name', 100).notNullable();
    t.uuid('approver_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.specificType('status', 'step_status').notNullable().defaultTo('awaiting');
    t.text('remarks');
    t.timestamp('acted_at', { useTz: true });
    t.timestamp('assigned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('approval_id');
    t.index('approver_id');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('approval_steps');
  await knex.raw('DROP TYPE IF EXISTS step_status;');
};
