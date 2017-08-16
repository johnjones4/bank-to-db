const config = require('../config');
const knex = exports.knex = require('knex')({
  'client': 'pg',
  // 'debug': true,
  'connection': config.database
});

exports.init = () => {
  return knex.schema.hasTable('transactions').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('transactions',function(table) {
        table.increments('id').primary().notNullable();
        table.string('source',64).notNullable();
        table.string('category',64);
        table.string('description',128).notNullable();
        table.datetime('date').notNullable();
        table.double('amount',128).notNullable();
      });
    }
  });
}

exports.insert = (record) => {
  return knex('transactions').insert(record);
}

exports.find = (row) => {
  return knex.select().from('transactions').where({
    source: row.source,
    description: row.description,
    date: row.date,
    amount: row.amount
  });
}

exports.findCategory = (description) => {
  return knex.select(knex.raw('category,levenshtein(description,?) as distance',[description])).from('transactions').whereRaw('levenshtein(description,?) < 10',[description]).orderBy('distance').limit(1);
}
