exports.up = async function (knex) {
  await knex.schema.createTable('rfq_attachments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('rfq_id').notNullable().references('id').inTable('rfqs').onDelete('CASCADE');
    t.string('file_name', 255).notNullable();
    t.text('file_url').notNullable();
    t.timestamp('uploaded_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('rfq_id');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('rfq_attachments');
};
