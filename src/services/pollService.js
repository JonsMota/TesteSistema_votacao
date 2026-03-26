const pollRepository = require('../repositories/pollRepository')

function createHttpError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function parseDate(value, fieldName) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(`Data inválida em ${fieldName}.`, 400)
  }

  return date
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return []
  }

  return options
    .map((option) => String(option || '').trim())
    .filter(Boolean)
}

function validatePollPayload(payload) {
  const title = String(payload.title || '').trim()
  const options = normalizeOptions(payload.options)
  const startAt = parseDate(payload.startAt, 'data de início')
  const endAt = parseDate(payload.endAt, 'data de término')

  if (!title) {
    throw createHttpError('O título da enquete é obrigatório.', 400)
  }

  if (options.length < 3) {
    throw createHttpError('A enquete deve ter no mínimo 3 opções.', 400)
  }

  if (startAt >= endAt) {
    throw createHttpError('A data de início deve ser anterior à data de término.', 400)
  }

  return {
    title,
    startAt,
    endAt,
    options
  }
}

function computeStatus(startAt, endAt, now = new Date()) {
  const currentDate = new Date(now)
  const startDate = new Date(startAt)
  const endDate = new Date(endAt)

  if (currentDate < startDate) {
    return 'não iniciada'
  }

  if (currentDate > endDate) {
    return 'finalizada'
  }

  return 'em andamento'
}

function decoratePoll(poll) {
  if (!poll) {
    return null
  }

  return {
    ...poll,
    status: computeStatus(poll.startAt, poll.endAt),
    totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0)
  }
}

async function listPolls() {
  const polls = await pollRepository.findAll()
  return polls.map(decoratePoll)
}

async function getPollById(id) {
  const poll = await pollRepository.findById(id)

  if (!poll) {
    throw createHttpError('Enquete não encontrada.', 404)
  }

  return decoratePoll(poll)
}

async function createPoll(payload) {
  const data = validatePollPayload(payload)
  const poll = await pollRepository.create(data)
  return decoratePoll(poll)
}

async function updatePoll(id, payload) {
  const data = validatePollPayload(payload)
  const poll = await pollRepository.findById(id)

  if (!poll) {
    throw createHttpError('Enquete não encontrada.', 404)
  }

  const updatedPoll = await pollRepository.update(id, data)
  return decoratePoll(updatedPoll)
}

async function deletePoll(id) {
  const poll = await pollRepository.findById(id)

  if (!poll) {
    throw createHttpError('Enquete não encontrada.', 404)
  }

  await pollRepository.remove(id)
}

async function votePoll(pollId, optionId) {
  const poll = await pollRepository.findById(pollId)

  if (!poll) {
    throw createHttpError('Enquete não encontrada.', 404)
  }

  const status = computeStatus(poll.startAt, poll.endAt)

  if (status !== 'em andamento') {
    throw createHttpError('A enquete não está ativa.', 403)
  }

  const selectedOption = poll.options.find((option) => option.id === optionId)

  if (!selectedOption) {
    throw createHttpError('Opção de resposta não encontrada.', 404)
  }

  const updatedPoll = await pollRepository.vote(pollId, optionId)
  return decoratePoll(updatedPoll)
}

module.exports = {
  listPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  computeStatus
}
