const Koa = require('koa')
const Router = require('../lib/router')
const PORT = 3000


const app = new Koa()
const router = new Router()

router.get('/', (ctx, next) => {
  ctx.body = 'hello word'
})

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})