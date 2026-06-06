exports.up = async function (knex) {
  await knex.schema.createTable('activity_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('entity_type', 50).notNullable();
    t.uuid('entity_id').notNullable();
    t.string('action', 255).notNullable();
    t.uuid('performed_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.jsonb('metadata');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('entity_type');
    t.index('entity_id');
    t.index('performed_by');
    t.index('created_at');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('activity_logs');
};
