const pollService = require('../services/pollService')
const { getIo } = require('../config/socket')

function emitPollChange() {
  const io = getIo()

  if (io) {
    io.emit('polls:changed')
  }
}

async function listPolls(request, reply) {
  const polls = await pollService.listPolls()
  return reply.send(polls)
}

async function getPollById(request, reply) {
  const poll = await pollService.getPollById(Number(request.params.id))
  return reply.send(poll)
}

async function createPoll(request, reply) {
  const poll = await pollService.createPoll(request.body)
  emitPollChange()
  return reply.code(201).send(poll)
}

async function updatePoll(request, reply) {
  const poll = await pollService.updatePoll(Number(request.params.id), request.body)
  emitPollChange()
  return reply.send(poll)
}

async function deletePoll(request, reply) {
  await pollService.deletePoll(Number(request.params.id))
  emitPollChange()
  return reply.code(204).send()
}

async function votePoll(request, reply) {
  const poll = await pollService.votePoll(Number(request.params.id), Number(request.body.optionId))
  emitPollChange()
  return reply.send(poll)
}

module.exports = {
  listPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll
}
