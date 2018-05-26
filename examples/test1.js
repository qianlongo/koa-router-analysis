const Koa = require('koa')
const Router = require('../lib/router')
const PORT = 3000


const app = new Koa()
const router = new Router()

// router.get('/*', (ctx, next) => {
//   ctx.body = 'hello word'
//   next()
// })

// router.get('hello', '/hello', (ctx, next) => {
//   ctx.body = 'hello word /hello'
//   console.log('hello word', ctx._matchedRoute, ctx._matchedRouteName)
//   next()
// })

// router.register('/user', [ 'get' ], (ctx, next) => {
//   ctx.body = 'user id'
//   console.log('user', ctx.params.id)
//   next()
// })

router.register('/users/:user', [ 'get' ], (ctx, next) => {
  ctx.body = 'user'
  console.log('user', ctx.params)
  next()
})

router.param('user', async (user, ctx, next) => {
  console.log(user)
  let users = [ '11', '12', '13']
  this.user = users[user]

  if (!this.user) {
    return this.body = 404
  }

  next()
})

// router.use((ctx, next) => {
//   let { path } = ctx
//   console.log(path)
// })

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})