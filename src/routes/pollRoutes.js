const pollController = require('../controllers/pollController')

async function pollRoutes(fastify) {
	fastify.get('/', pollController.listPolls)
	fastify.get('/:id', pollController.getPollById)
	fastify.post('/', pollController.createPoll)
	fastify.put('/:id', pollController.updatePoll)
	fastify.delete('/:id', pollController.deletePoll)
	fastify.post('/:id/vote', pollController.votePoll)
}

module.exports = pollRoutes
