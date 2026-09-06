/**
 * Migration: add `archived_at` timestamp column to the `resumes` table.
 */
exports.up = function up(knex) {
  return knex.schema.alterTable('resumes', (table) => {
    table.timestamp('archived_at').nullable();
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable('resumes', (table) => {
    table.dropColumn('archived_at');
  });
};