const Koa = require('koa')

const app = new Koa()
const PORT = 4000
app.use(async (ctx, next) => {
  switch (ctx.path) {
    case '/user':
      ctx.body = 'hello /user'
    break
    case '/name':
      ctx.body = 'hello /name'
    break
    case '/sex':
      ctx.body = 'hello /sex'
    break
    default:
      ctx.body = 'hello world'
    break
  }
})

app.listen(PORT, () => {
  console.log(`server start localhost:${PORT}`)
})