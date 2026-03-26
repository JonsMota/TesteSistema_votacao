const path = require('path')
const fastify = require('fastify')({ logger: false })
const fastifyCors = require('@fastify/cors')
const fastifyStatic = require('@fastify/static')
const pollRoutes = require('./routes/pollRoutes')
const errorHandler = require('./middlewares/errorHandler')

fastify.register(fastifyCors, { origin: true })
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/'
})

fastify.get('/api/health', async () => ({ status: 'ok' }))

fastify.register(pollRoutes, { prefix: '/api/polls' })

fastify.setNotFoundHandler((request, reply) => {
  if (request.raw.url && request.raw.url.startsWith('/api/')) {
    return reply.code(404).send({ message: 'Rota não encontrada.' })
  }

  return reply.type('text/html').sendFile('index.html')
})

fastify.setErrorHandler(errorHandler)

module.exports = fastify
