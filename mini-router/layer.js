let pathToRegExp = require('path-to-regexp')

module.exports = class Layer {
  constructor (path, methods, middleware) {
    this.path = path
    this.methods = methods.join(' ').toUpperCase().split(' ')
    this.stack = Array.isArray(middleware) ? middleware : [ middleware ]
    this.regexp = pathToRegExp(path, [], {})
  }

  match (path) {
    return this.regexp.test(path)
  }
}