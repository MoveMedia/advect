import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('full_name');
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.boolean('is_admin').defaultTo(false)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}