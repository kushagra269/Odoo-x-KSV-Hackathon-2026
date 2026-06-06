exports.up = async function (knex) {
  await knex.schema.createTable('quotation_line_items', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('quotation_id').notNullable().references('id').inTable('quotations').onDelete('CASCADE');
    t.uuid('rfq_line_item_id').notNullable().references('id').inTable('rfq_line_items').onDelete('RESTRICT');
    t.string('item_name', 255).notNullable();
    t.decimal('quantity', 10, 2).notNullable();
    t.decimal('unit_price', 12, 2).notNullable();
    t.decimal('total_price', 12, 2).notNullable();
    t.integer('delivery_days').notNullable().defaultTo(0);
    t.index('quotation_id');
    t.index('rfq_line_item_id');
  });
};
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('quotation_line_items');
};
