/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const UsersController = () => import('#controllers/users_controller')
import router from '@adonisjs/core/services/router'
router.resource('users', UsersController)

router.on('/').render('pages/home')
router.on('/auth').render('pages/auth/index')
router.on('/auth/register').render('pages/auth/register')
router.on('/auth/login').render('pages/auth/login')
