const path = require('path')
const config = require('./config/config')
const jsonServer = require('json-server')
const rules = require(path.join(__dirname, config.RULES))
const dbfile = require(path.join(__dirname, config.DB_FILE))

const ip = config.SERVER
const port = config.PORT

const server = jsonServer.create()
const router = jsonServer.router(dbfile)
const middlewares = jsonServer.defaults()

// console.log(dbfile())
// console.log(rules);

server.use(jsonServer.bodyParser)
server.use(middlewares)

// server.get('/echo', (req, res) => {
//     res.jsonp(req.query)
// })

server.use((req, res, next) => {
  res.header('X-Hello', 'World')
  next()
})

router.render = (req, res) => {
  res.jsonp({
    code: 0,
    message: '请求成功',
    data: res.locals.data
  })
}

server.use('/api', router)
server.use(jsonServer.rewriter(rules))
server.use(router)

server.listen({
  host: ip,
  port: port
}, function () {
  console.log(JSON.stringify(jsonServer))
  console.log(`JSON Server is running in http://${ip}:${port}`)
})
