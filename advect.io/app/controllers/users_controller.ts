// import type { HttpContext } from '@adonisjs/core/http'

import User from "#models/user";
        import db from '@adonisjs/lucid/services/db'
        import { HttpContext } from "@adonisjs/core/http";
import { pgDataTypeToHtmlInputType } from "../helpers.js";



async function generateTableSchema() {
    const tableSchemaQuery = await db.rawQuery(`select column_name, data_type, character_maximum_length, column_default, is_nullable
        from INFORMATION_SCHEMA.COLUMNS where table_name = '${User.table}';`)

        const models = [...User.$columnsDefinitions.entries()].map(([name, column]) => {
            return {
                name,
                primary: column.isPrimary,
                column_name: column.columnName
            }
        })

    const schema = {
        table: User.table,
        columns: tableSchemaQuery.rows.map((row: any) => {
            return {
                ...row, 
                model:models.find((column: any) => column.column_name === row.column_name),
                view:{ 
                    type:pgDataTypeToHtmlInputType(row.data_type, row.column_name),
                }
            }
        }),
    }
    return schema
}

export default class UsersController {
    async index({  view  }: HttpContext) {
        return view.render('components/data/table', {
            title: User.table.toUpperCase(),
            schema: await generateTableSchema(),
            rows: await User.all(),
         });
    }


      /**
   * Render the form to create a new post.
   *
   * Not needed if you are creating an API server.
   */
  async create({view}: HttpContext) {
    return view.render('components/data/editor', {
        title: User.table.toUpperCase(),
        schema: await generateTableSchema(),
        row: await User.all(),
     });
  }

  /**
   * Handle form submission to create a new post
   */
  async store() {}

  /**
   * Display a single post by id.
   */
  async show({params}:HttpContext) {
    return User.findOrFail(params.id);
  }

  /**
   * Render the form to edit an existing post by its id.
   *
   * Not needed if you are creating an API server.
   */
  async edit() {
    
  }

  /**
   * Handle the form submission to update a specific post by id
   */
  async update( { params, request,response ,view }: HttpContext) {
    const user = await User.find(parseInt(params.id));



    if (!user) {
        return response.notFound();
    }
    
    user.email = request.input('email');
    user.password = request.input('password');
    user.fullName = request.input('full_name');
    user.isAdmin = request.input('is_admin');
    await user.save();

    console.log('patching')

    return view.renderRaw('patched', {})

  }


  /**
   * Handle the form submission to delete a specific post by id.
   */
  async destroy({ params,response,view }: HttpContext) {
    const user = await User.find(params.id);
    if (!user) {
        return response.notFound();
    }
    await user.delete();
    return view.renderRaw('', {})
  }
}
