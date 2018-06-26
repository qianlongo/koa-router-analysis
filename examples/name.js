const Koa = require('koa')
const Router = require('../lib/router')
const PORT = 3000

const app = new Koa()
const router = new Router()

router.get('user', '/user', async (ctx) => {
  ctx.body = 'user'
})

router.get('test', '/test', async (ctx) => {
  ctx.body = 'test'
})

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})