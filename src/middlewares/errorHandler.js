function errorHandler(error, request, reply) {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Erro interno do servidor.'

  return reply.code(statusCode).send({ message })
}

module.exports = errorHandler
