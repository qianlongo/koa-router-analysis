/**
 * RESTful resource routing middleware for koa.
 *
 * @author Alex Mingoia <talk@alexmingoia.com>
 * @link https://github.com/alexmingoia/koa-router
 */

var debug = require('debug')('koa-router');
var compose = require('koa-compose');
var HttpError = require('http-errors');
// https://github.com/jshttp/methods
var methods = require('methods');
var Layer = require('./layer');

/**
 * @module koa-router
 */

module.exports = Router;

/**
 * Create a new router.
 *
 * @example
 *
 * Basic usage:
 *
 * ```javascript
 * var Koa = require('koa');
 * var Router = require('koa-router');
 *
 * var app = new Koa();
 * var router = new Router();
 *
 * router.get('/', (ctx, next) => {
 *   // ctx.router available
 * });
 *
 * app
 *   .use(router.routes())
 *   .use(router.allowedMethods());
 * ```
 *
 * @alias module:koa-router
 * @param {Object=} opts
 * @param {String=} opts.prefix prefix router paths
 * @constructor
 */

function Router(opts) {
  /**
   * 判断是否使用new形式调用koa-router，不是则内部使用new调用,再返回，所以支持如下使用方式
   * 1. new Router(opts)
   * 2. Router(opts)
   */
  if (!(this instanceof Router)) {
    return new Router(opts);
  }
  /**
   * 保存外部传进来的参数opts,内部主要会用到以下几个属性
   * prefix 路由前缀
   * strict 用于path-to-regexp 末尾斜杠是否精确匹配（default: false，不是）
   * sensitive 用于path-to-regexp 大小写精确匹配（default: false，不是）
   * methods 支持的方法
   */
  this.opts = opts || {};
  // 路由所支持的方法集合
  this.methods = this.opts.methods || [
    'HEAD',
    'OPTIONS',
    'GET',
    'PUT',
    'PATCH',
    'POST',
    'DELETE'
  ];
  // 对参数进行验证的中间件函数集合
  this.params = {};
  // 存储Layer路由实例
  this.stack = [];
};

/**
 * Create `router.verb()` methods, where *verb* is one of the HTTP verbs such
 * as `router.get()` or `router.post()`.
 *
 * Match URL patterns to callback functions or controller actions using `router.verb()`,
 * where **verb** is one of the HTTP verbs such as `router.get()` or `router.post()`.
 *
 * Additionaly, `router.all()` can be used to match against all methods.
 *
 * ```javascript
 * router
 *   .get('/', (ctx, next) => {
 *     ctx.body = 'Hello World!';
 *   })
 *   .post('/users', (ctx, next) => {
 *     // ...
 *   })
 *   .put('/users/:id', (ctx, next) => {
 *     // ...
 *   })
 *   .del('/users/:id', (ctx, next) => {
 *     // ...
 *   })
 *   .all('/users/:id', (ctx, next) => {
 *     // ...
 *   });
 * ```
 *
 * When a route is matched, its path is available at `ctx._matchedRoute` and if named,
 * the name is available at `ctx._matchedRouteName`
 *
 * Route paths will be translated to regular expressions using
 * [path-to-regexp](https://github.com/pillarjs/path-to-regexp).
 *
 * Query strings will not be considered when matching requests.
 *
 * #### Named routes
 *
 * Routes can optionally have names. This allows generation of URLs and easy
 * renaming of URLs during development.
 *
 * ```javascript
 * router.get('user', '/users/:id', (ctx, next) => {
 *  // ...
 * });
 *
 * router.url('user', 3);
 * // => "/users/3"
 * ```
 *
 * #### Multiple middleware
 *
 * Multiple middleware may be given:
 *
 * ```javascript
 * router.get(
 *   '/users/:id',
 *   (ctx, next) => {
 *     return User.findOne(ctx.params.id).then(function(user) {
 *       ctx.user = user;
 *       next();
 *     });
 *   },
 *   ctx => {
 *     console.log(ctx.user);
 *     // => { id: 17, name: "Alex" }
 *   }
 * );
 * ```
 *
 * ### Nested routers
 *
 * Nesting routers is supported:
 *
 * ```javascript
 * var forums = new Router();
 * var posts = new Router();
 *
 * posts.get('/', (ctx, next) => {...});
 * posts.get('/:pid', (ctx, next) => {...});
 * forums.use('/forums/:fid/posts', posts.routes(), posts.allowedMethods());
 *
 * // responds to "/forums/123/posts" and "/forums/123/posts/123"
 * app.use(forums.routes());
 * ```
 *
 * #### Router prefixes
 *
 * Route paths can be prefixed at the router level:
 *
 * ```javascript
 * var router = new Router({
 *   prefix: '/users'
 * });
 *
 * router.get('/', ...); // responds to "/users"
 * router.get('/:id', ...); // responds to "/users/:id"
 * ```
 *
 * #### URL parameters
 *
 * Named route parameters are captured and added to `ctx.params`.
 *
 * ```javascript
 * router.get('/:category/:title', (ctx, next) => {
 *   console.log(ctx.params);
 *   // => { category: 'programming', title: 'how-to-node' }
 * });
 * ```
 *
 * The [path-to-regexp](https://github.com/pillarjs/path-to-regexp) module is
 * used to convert paths to regular expressions.
 *
 * @name get|put|post|patch|delete|del
 * @memberof module:koa-router.prototype
 * @param {String} path
 * @param {Function=} middleware route middleware(s)
 * @param {Function} callback route callback
 * @returns {Router}
 */

/** 
 * Router.prototype['get' || 'post' ...]
 * 为Router原型添加部分快捷方法
 */
methods.forEach(function (method) {
  Router.prototype[method] = function (name, path, middleware) {
    // middleware 支持流式处理的关键
    var middleware;
    // 当path是string或者正则表达式时，middleware为arguments索引2以后的值，并通过slice将其变成数组
    if (typeof path === 'string' || path instanceof RegExp) {
      middleware = Array.prototype.slice.call(arguments, 2);
    } else {
      // 如果是非具名路由，middleware为arguments索引1以后的值，并通过slice将其变成数组
      // 并对name和path做兼容处理
      middleware = Array.prototype.slice.call(arguments, 1);
      path = name;
      name = null;
    }
    // 真正注册路由的方法,注意这里的method是数组，register支持多method映射
    this.register(path, [method], middleware, {
      name: name
    });
    // 将this返回，从而支持链式调用
    return this;
  };
});
// 给delete方法设置别名del，因为delete是保留字
// Alias for `router.delete()` because delete is a reserved word
Router.prototype.del = Router.prototype['delete'];

/**
 * Use given middleware.
 *
 * Middleware run in the order they are defined by `.use()`. They are invoked
 * sequentially, requests start at the first middleware and work their way
 * "down" the middleware stack.
 *
 * @example
 *
 * ```javascript
 * // session middleware will run before authorize
 * router
 *   .use(session())
 *   .use(authorize());
 *
 * // use middleware only with given path
 * router.use('/users', userAuth());
 *
 * // or with an array of paths
 * router.use(['/users', '/admin'], userAuth());
 *
 * app.use(router.routes());
 * ```
 *
 * @param {String=} path
 * @param {Function} middleware
 * @param {Function=} ...
 * @returns {Router}
 */
// 也可以通过use方法去添加路由中间件(备注：该方法还需要细看，还没有完全弄明白)
Router.prototype.use = function () {
  var router = this;
  // 将参数通过slice方法转变成数组
  var middleware = Array.prototype.slice.call(arguments);
  var path;
  // 支持数组path注册路由，如果是数组形式，则再次通过use方法循环单个路径注册
  // support array of paths
  if (Array.isArray(middleware[0]) && typeof middleware[0][0] === 'string') {
    middleware[0].forEach(function (p) {
      router.use.apply(router, [p].concat(middleware.slice(1)));
    });

    return this;
  }

  var hasPath = typeof middleware[0] === 'string';
  /**
   * router.use('/user', () => {})
   * 如果第一个参数是字符串，再将middleware的第一个元素删除，数组的其他元素则是路由处理函数，删除的元素则是要匹配的路径
   */
  if (hasPath) {
    path = middleware.shift();
  }

  middleware.forEach(function (m) {
    // 这里啥情况？
    if (m.router) {
      m.router.stack.forEach(function (nestedLayer) {
        if (path) nestedLayer.setPrefix(path);
        if (router.opts.prefix) nestedLayer.setPrefix(router.opts.prefix);
        router.stack.push(nestedLayer);
      });

      if (router.params) {
        Object.keys(router.params).forEach(function (key) {
          m.router.param(key, router.params[key]);
        });
      }
    } else {
      // 这里为啥要挨个注册呢？register支持多个middleware啊
      router.register(path || '(.*)', [], m, { end: false, ignoreCaptures: !hasPath });
    }
  });

  return this;
};

/**
 * Set the path prefix for a Router instance that was already initialized.
 *
 * @example
 *
 * ```javascript
 * router.prefix('/things/:thing_id')
 * ```
 *
 * @param {String} prefix
 * @returns {Router}
 */

// 给路由实例添加前缀

Router.prototype.prefix = function (prefix) {
  prefix = prefix.replace(/\/$/, '');

  this.opts.prefix = prefix;

  this.stack.forEach(function (route) {
    route.setPrefix(prefix);
  });

  return this;
};

/**
 * Returns router middleware which dispatches a route matching the request.
 *
 * @returns {Function}
 */

Router.prototype.routes = Router.prototype.middleware = function () {
  var router = this;
  // koa中注册的是dispatch函数
  var dispatch = function dispatch(ctx, next) {
    debug('%s %s', ctx.method, ctx.path);
    // 获取要匹配的当前的请求路径
    var path = router.opts.routerPath || ctx.routerPath || ctx.path;
    // 经过router.match方法处理之后的符合当前的路径规则的Layer，具体返回值如下
    /* 
      var matched = {
        path: [], // 保存了path匹配的路由数组
        pathAndMethod: [], // 保存了path和methods都匹配的路由数组
        route: false // 是否有对应的路由
      };
    */
    var matched = router.match(path, ctx.method);
    var layerChain, layer, i;
    
    if (ctx.matched) {
      ctx.matched.push.apply(ctx.matched, matched.path);
    } else {
      ctx.matched = matched.path;
    }
    // 关注一下这里，会将koa-router路由实例挂载在当前的执行环境上
    ctx.router = router;
    // matched.route 不为真，则将中间件的执行权移交给下一个中间件去
    if (!matched.route) return next();

    var matchedLayers = matched.pathAndMethod
    var mostSpecificLayer = matchedLayers[matchedLayers.length - 1]
    ctx._matchedRoute = mostSpecificLayer.path;
    if (mostSpecificLayer.name) {
      ctx._matchedRouteName = mostSpecificLayer.name;
    }
    // 使用reduce将匹配的路由形成一条链
    layerChain = matchedLayers.reduce(function(memo, layer) {
      // 给每一个Layer实例前添加一个匿名处理函数
      // 在每个匹配的路由对应的中间件处理函数数组前添加一个用于处理对应路由的 captures, params, 以及路由命名的函数
      memo.push(function(ctx, next) {
        // 返回路由参数 key
        ctx.captures = layer.captures(path, ctx.captures);
        //  返回参数的key和对应的value组成的对象
        ctx.params = layer.params(path, ctx.captures, ctx.params);
        // 定义路由时的名字
        ctx.routerName = layer.name;
        // 执行权交给下一个中间件
        return next();
      });
      return memo.concat(layer.stack);
    }, []);
    // 通过compose给layerChain包一层，并立即执行
    return compose(layerChain)(ctx, next);
  };

  dispatch.router = this;

  return dispatch;
};

/**
 * Returns separate middleware for responding to `OPTIONS` requests with
 * an `Allow` header containing the allowed methods, as well as responding
 * with `405 Method Not Allowed` and `501 Not Implemented` as appropriate.
 *
 * @example
 *
 * ```javascript
 * var Koa = require('koa');
 * var Router = require('koa-router');
 *
 * var app = new Koa();
 * var router = new Router();
 *
 * app.use(router.routes());
 * app.use(router.allowedMethods());
 * ```
 *
 * **Example with [Boom](https://github.com/hapijs/boom)**
 *
 * ```javascript
 * var Koa = require('koa');
 * var Router = require('koa-router');
 * var Boom = require('boom');
 *
 * var app = new Koa();
 * var router = new Router();
 *
 * app.use(router.routes());
 * app.use(router.allowedMethods({
 *   throw: true,
 *   notImplemented: () => new Boom.notImplemented(),
 *   methodNotAllowed: () => new Boom.methodNotAllowed()
 * }));
 * ```
 *
 * @param {Object=} options
 * @param {Boolean=} options.throw throw error instead of setting status and header
 * @param {Function=} options.notImplemented throw the returned value in place of the default NotImplemented error
 * @param {Function=} options.methodNotAllowed throw the returned value in place of the default MethodNotAllowed error
 * @returns {Function}
 */

Router.prototype.allowedMethods = function (options) {
  options = options || {};
  var implemented = this.methods;

  return function allowedMethods(ctx, next) {
    return next().then(function() {
      var allowed = {};

      if (!ctx.status || ctx.status === 404) {
        ctx.matched.forEach(function (route) {
          route.methods.forEach(function (method) {
            allowed[method] = method;
          });
        });

        var allowedArr = Object.keys(allowed);

        if (!~implemented.indexOf(ctx.method)) {
          if (options.throw) {
            var notImplementedThrowable;
            if (typeof options.notImplemented === 'function') {
              notImplementedThrowable = options.notImplemented(); // set whatever the user returns from their function
            } else {
              notImplementedThrowable = new HttpError.NotImplemented();
            }
            throw notImplementedThrowable;
          } else {
            ctx.status = 501;
            ctx.set('Allow', allowedArr.join(', '));
          }
        } else if (allowedArr.length) {
          if (ctx.method === 'OPTIONS') {
            ctx.status = 200;
            ctx.body = '';
            ctx.set('Allow', allowedArr.join(', '));
          } else if (!allowed[ctx.method]) {
            if (options.throw) {
              var notAllowedThrowable;
              if (typeof options.methodNotAllowed === 'function') {
                notAllowedThrowable = options.methodNotAllowed(); // set whatever the user returns from their function
              } else {
                notAllowedThrowable = new HttpError.MethodNotAllowed();
              }
              throw notAllowedThrowable;
            } else {
              ctx.status = 405;
              ctx.set('Allow', allowedArr.join(', '));
            }
          }
        }
      }
    });
  };
};

/**
 * Register route with all methods.
 *
 * @param {String} name Optional.
 * @param {String} path
 * @param {Function=} middleware You may also pass multiple middleware.
 * @param {Function} callback
 * @returns {Router}
 * @private
 */
// 所有方法都支持的注册路由的方法
Router.prototype.all = function (name, path, middleware) {
  var middleware;

  if (typeof path === 'string') {
    middleware = Array.prototype.slice.call(arguments, 2);
  } else {
    middleware = Array.prototype.slice.call(arguments, 1);
    path = name;
    name = null;
  }

  this.register(path, methods, middleware, {
    name: name
  });

  return this;
};

/**
 * Redirect `source` to `destination` URL with optional 30x status `code`.
 *
 * Both `source` and `destination` can be route names.
 *
 * ```javascript
 * router.redirect('/login', 'sign-in');
 * ```
 *
 * This is equivalent to:
 *
 * ```javascript
 * router.all('/login', ctx => {
 *   ctx.redirect('/sign-in');
 *   ctx.status = 301;
 * });
 * ```
 *
 * @param {String} source URL or route name.
 * @param {String} destination URL or route name.
 * @param {Number=} code HTTP status code (default: 301).
 * @returns {Router}
 */

Router.prototype.redirect = function (source, destination, code) {
  // lookup source route by name
  if (source[0] !== '/') {
    source = this.url(source);
  }

  // lookup destination route by name
  if (destination[0] !== '/') {
    destination = this.url(destination);
  }

  return this.all(source, ctx => {
    ctx.redirect(destination);
    ctx.status = code || 301;
  });
};

/**
 * Create and register a route.
 *
 * @param {String} path Path string.
 * @param {Array.<String>} methods Array of HTTP verbs.
 * @param {Function} middleware Multiple middleware also accepted.
 * @returns {Layer}
 * @private
 */

Router.prototype.register = function (path, methods, middleware, opts) {
  opts = opts || {};

  var router = this;
  var stack = this.stack;
  /**
   *  router.get([ '/a', '/b', '/c' ], async () {
   *    // xxx
   *  })
   */
  // 支持数组路由形式
  // support array of paths
  if (Array.isArray(path)) {
    path.forEach(function (p) {
      router.register.call(router, p, methods, middleware, opts);
    });
    // 返回this 支持链式调用
    return this;
  }
  /**
   * 创建Layer实例
   * 1. 将path(字符串或正则)转化成正则形式
   * 2. 以下是Layer的几个重要实例属性
   *    1. opts 注册路由时传进来opts
   *    2. name 路由名称
   *    3. methods 注册路由时传进来的methods
   *    4. stack 路由处理函数中间件
   */
  // create route
  // https://github.com/pillarjs/path-to-regexp 第四个参数主要是path-to-regexp所需要的参数
  var route = new Layer(path, methods, middleware, {
    end: opts.end === false ? opts.end : true, // 是否是全局匹配，相当于，带不带 /g 标识符。(defualt: true，带 /g)
    name: opts.name, // 路由名称
    sensitive: opts.sensitive || this.opts.sensitive || false, // 大小写精确匹配（default: false，不是）
    strict: opts.strict || this.opts.strict || false, // 末尾斜杠是否精确匹配（default: false，不是）
    prefix: opts.prefix || this.opts.prefix || "", // 路由前缀
    ignoreCaptures: opts.ignoreCaptures // 暂时未知???
  });
  // 设置路由前缀
  if (this.opts.prefix) {
    route.setPrefix(this.opts.prefix);
  }
  // 添加参数校验中间件
  // add parameter middleware
  Object.keys(this.params).forEach(function (param) {
    route.param(param, this.params[param]);
  }, this);
  // 往stack中添加Layer实例
  stack.push(route);

  return route;
};

/**
 * Lookup route with given `name`.
 *
 * @param {String} name
 * @returns {Layer|false}
 */
// 查找指定名字的路由实例
Router.prototype.route = function (name) {
  var routes = this.stack;

  for (var len = routes.length, i=0; i<len; i++) {
    if (routes[i].name && routes[i].name === name) {
      return routes[i];
    }
  }

  return false;
};

/**
 * Generate URL for route. Takes a route name and map of named `params`.
 *
 * @example
 *
 * ```javascript
 * router.get('user', '/users/:id', (ctx, next) => {
 *   // ...
 * });
 *
 * router.url('user', 3);
 * // => "/users/3"
 *
 * router.url('user', { id: 3 });
 * // => "/users/3"
 *
 * router.use((ctx, next) => {
 *   // redirect to named route
 *   ctx.redirect(ctx.router.url('sign-in'));
 * })
 *
 * router.url('user', { id: 3 }, { query: { limit: 1 } });
 * // => "/users/3?limit=1"
 *
 * router.url('user', { id: 3 }, { query: "limit=1" });
 * // => "/users/3?limit=1"
 * ```
 *
 * @param {String} name route name
 * @param {Object} params url parameters
 * @param {Object} [options] options parameter
 * @param {Object|String} [options.query] query options
 * @returns {String|Error}
 */

Router.prototype.url = function (name, params) {
  var route = this.route(name);

  if (route) {
    var args = Array.prototype.slice.call(arguments, 1);
    return route.url.apply(route, args);
  }

  return new Error("No route found for name: " + name);
};

/**
 * Match given `path` and return corresponding routes.
 *
 * @param {String} path
 * @param {String} method
 * @returns {Object.<path, pathAndMethod>} returns layers that matched path and
 * path and method.
 * @private
 */

Router.prototype.match = function (path, method) {
  // this.stack 即为路由实例数组
  var layers = this.stack;
  var layer;
  // 命中的路由
  var matched = {
    path: [],
    pathAndMethod: [], // 包含路由处理函数
    route: false
  };

  for (var len = layers.length, i = 0; i < len; i++) {
    layer = layers[i];

    debug('test %s %s', layer.path, layer.regexp);
    /**
     * 第一重匹配，路径匹配
     * Layer的match方法，检测当前的路由是否与layer注册时生成的path正则相匹配
     */
    if (layer.match(path)) {
      matched.path.push(layer);
      /**
       * 第二重匹配，方法(get post...)匹配
       * layer没有指定method(比如通过router.use(() => {})添加的这种形式的路由中间件)，或者当前请求的method在注册时允许的methods中
       */
      if (layer.methods.length === 0 || ~layer.methods.indexOf(method)) {
        matched.pathAndMethod.push(layer);
        // 如果没有这句话，就算匹配中了路径，也不会走到对应的路由处理函数中去，具体看Router.prototype.routes
        // 用于判断是否真正匹配到路由处理函数
        if (layer.methods.length) matched.route = true;
      }
    }
  }

  return matched;
};

/**
 * Run middleware for named route parameters. Useful for auto-loading or
 * validation.
 *
 * @example
 *
 * ```javascript
 * router
 *   .param('user', (id, ctx, next) => {
 *     ctx.user = users[id];
 *     if (!ctx.user) return ctx.status = 404;
 *     return next();
 *   })
 *   .get('/users/:user', ctx => {
 *     ctx.body = ctx.user;
 *   })
 *   .get('/users/:user/friends', ctx => {
 *     return ctx.user.getFriends().then(function(friends) {
 *       ctx.body = friends;
 *     });
 *   })
 *   // /users/3 => {"id": 3, "name": "Alex"}
 *   // /users/3/friends => [{"id": 4, "name": "TJ"}]
 * ```
 *
 * @param {String} param
 * @param {Function} middleware
 * @returns {Router}
 */

Router.prototype.param = function (param, middleware) {
  this.params[param] = middleware;
  this.stack.forEach(function (route) {
    route.param(param, middleware);
  });
  return this;
};

/**
 * Generate URL from url pattern and given `params`.
 *
 * @example
 *
 * ```javascript
 * var url = Router.url('/users/:id', {id: 1});
 * // => "/users/1"
 * ```
 *
 * @param {String} path url pattern
 * @param {Object} params url parameters
 * @returns {String}
 */
Router.url = function (path, params) {
    var args = Array.prototype.slice.call(arguments, 1);
    return Layer.prototype.url.apply({ path: path }, args);
};
