import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    await User.createMany([
      {
        email: 'virk@adonisjs.com',
        password: 'secret',
        fullName: 'Harminder Virk',
        isAdmin: true,
      },
      {
        email: 'romain@adonisjs.com',
        password: 'supersecret',
        fullName: 'Harminder Virk',
      },
    ])
  }
}