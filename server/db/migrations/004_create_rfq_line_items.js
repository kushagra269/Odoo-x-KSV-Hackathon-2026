exports.up = async function (knex) {
  await knex.schema.createTable('rfq_line_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('rfq_id').notNullable().references('id').inTable('rfqs').onDelete('CASCADE');
    t.string('item_name', 255).notNullable();
    t.decimal('quantity', 10, 2).notNullable();
    t.string('unit', 50).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('rfq_id');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('rfq_line_items');
};
