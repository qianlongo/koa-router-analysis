const http = require('http')
const { parse } = require('url')

const PORT = 3000

const server = http.createServer((req, res) => {
  let { pathname } = parse(req.url)
  let resHtml = 'hello'

  if (pathname === '/') {
    resHtml += '/'
  } else if (pathname === '/test') {
    resHtml += '/test'
  } else if (pathname === '/st') {
    resHtml += '/st'
  } else if (pathname === '/prod') {
    resHtml += '/prod'
  }

  res.end(resHtml)
})

server.listen(PORT, () => {
  console.log(`server start at: ${PORT}`)
})
 