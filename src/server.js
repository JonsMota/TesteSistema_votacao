require('dotenv').config()

const { Server } = require('socket.io')
const app = require('./app')
const { setIo } = require('./config/socket')

const PORT = process.env.PORT || 3000
const io = new Server(app.server, {
  cors: {
    origin: true
  }
})

setIo(io)

io.on('connection', (socket) => {
  socket.emit('server:ready', { message: 'Socket conectado com sucesso.' })
})

app.listen({ port: PORT, host: '0.0.0.0' }, (error) => {
  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
