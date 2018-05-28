const Koa = require('koa')
const Router = require('../lib/router')
const PORT = 3000

const app = new Koa()
const router = new Router()

router.use('*', (ctx, next) => {
  console.log('inner----')
})

router.use('/a', (ctx, next) => {
  console.log('a----')
  next()
})

router.use('/b', (ctx, next) => {
  console.log('b----')
})

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})