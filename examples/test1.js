const Koa = require('koa')
const Router = require('../lib/router')
const PORT = 3000


const app = new Koa()
const router = new Router()

router.get('/*', (ctx, next) => {
  ctx.body = 'hello word'
  console.log('hello word')
  next()
})

router.register('/user', [ 'get' ], (ctx, next) => {
  ctx.body = 'user'
  console.log('user')
  next()
})

router.use((ctx, next) => {
  let { path } = ctx
  console.log(path)
})

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})