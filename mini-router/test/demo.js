const Koa = require('koa')
const Router = require('../router')

const app = new Koa()
const router = new Router()
const PORT = 8080

let sHtml = 'hello world '

router.get('*', async (ctx, next) => {
  ctx.body = sHtml + '*'
  next()
})

router.get('/name', async (ctx, next) => {
  ctx.body = sHtml + '/name'
})

router.get('/sex*', async (ctx, next) => {
  ctx.body = sHtml + '/sex'
  // next()
})

router.get('/sex/boy', async (ctx, next) => {
  ctx.body = sHtml + '/sex/boy'
})

router.get('/age/:id', async (ctx, next) => {
  ctx.body = sHtml + ctx.path
})

app.use(router.routes())

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})