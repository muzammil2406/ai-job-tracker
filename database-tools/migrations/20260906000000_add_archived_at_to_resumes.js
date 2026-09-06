/**
 * Migration: add `archived_at` timestamp column to the `Resume` table.
 * (Postgres preserves camelCase; the Prisma model is `Resume`.)
 */
exports.up = function up(knex) {
  return knex.schema.alterTable('Resume', (table) => {
    table.timestamp('archived_at').nullable();
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('Resume', (table) => {
    table.dropColumn('archived_at');
  });
};