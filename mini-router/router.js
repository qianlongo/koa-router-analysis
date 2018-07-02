const compose = require('koa-compose')
const Layer = require('./layer')

const METHODS = [ 'HEAD', 'OPTIONS', 'GET', 'PUT', 'PATCH', 'POST', 'DELETE' ]

module.exports = class Router {
  constructor () {
    // 支持的方法
    this.methods = METHODS
    // 路由队列
    this.stack = []
    // 注册原型方法
    this.regMethods()
  }
  regMethods () {
    this.methods.forEach((method) => {
      Router.prototype[ method.toLowerCase() ] = function (path) {
        this.register(path, [ method ], [].slice.call(arguments, 1))
      }
    })
  }
  // 注册路由的关键方法
  register (path, methods, middleware) {
    let router = this
    let stack = this.stack
    let route

    if (Array.isArray(path)) {
      path.forEach((p) => router.register.call(router, p, methods, middleware))
      // 支持链式调用
      return this
    }
    // 拿到Layer实例
    route = new Layer(path, methods, middleware)
    // 存储Layer实例
    stack.push(route)
  }
  // 查找匹配路由
  match (path, method) {
    let layers = this.stack
    let matched = {
      path: [],
      pathAndMethod: [],
      route: false
    }

    layers.forEach((layer) => {
      // 路径匹配
      if (layer.match(path)) {
        matched.path.push(layer)

        if (layer.methods.length === 0 || layer.methods.includes(method)) {
          matched.pathAndMethod.push(layer)
          matched.route = layer.methods.length !== 0
        }
      }
    })
    
    return matched
  }

  routes () {
    let router = this
    let dispatch = function dispatch (ctx, next) {
      let { path, method } = ctx
      let matched = router.match(path, method)
      let matchedLayers = matched.pathAndMethod
      let layerChain

      if (matched.route) {
        layerChain = matchedLayers.reduce((memo, layer) => {
          return memo.concat(layer.stack)
        }, [])

        return compose(layerChain)(ctx, next)
      } else {
        return next()
      }
    }

    return dispatch
  }
}