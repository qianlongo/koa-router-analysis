const Koa = require('koa')
const Router = require('../router')
const PORT = 3000

const app = new Koa()
const router = new Router()

let sHtml = 'hello world'

router.get('/a', (ctx, next) => {
  console.log('a----')
  next()
})

router.get('*', (ctx, next) => {
  sHtml = '*----'
  console.log(sHtml)
  next()
})

router.get('/b', (ctx, next) => {
  sHtml = 'b----'
  console.log(sHtml)
  ctx.body = sHtml
})

router.get([ '/c', '/d' ], (ctx, next) => {
  sHtml = 'c----d'
  console.log(sHtml)
  ctx.body = sHtml
})

app.use(router.routes())

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})