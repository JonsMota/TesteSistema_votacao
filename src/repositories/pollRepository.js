const prisma = require('../config/prisma')

function findAll() {
  return prisma.poll.findMany({
    include: {
      options: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

function findById(id) {
  return prisma.poll.findUnique({
    where: { id },
    include: {
      options: true
    }
  })
}

function create(data) {
  return prisma.poll.create({
    data: {
      title: data.title,
      startAt: data.startAt,
      endAt: data.endAt,
      options: {
        create: data.options.map((optionText) => ({ text: optionText }))
      }
    },
    include: {
      options: true
    }
  })
}

async function update(id, data) {
  return prisma.$transaction(async (tx) => {
    await tx.poll.update({
      where: { id },
      data: {
        title: data.title,
        startAt: data.startAt,
        endAt: data.endAt
      }
    })

    await tx.pollOption.deleteMany({ where: { pollId: id } })

    await tx.pollOption.createMany({
      data: data.options.map((optionText) => ({
        pollId: id,
        text: optionText
      }))
    })

    return tx.poll.findUnique({
      where: { id },
      include: {
        options: true
      }
    })
  })
}

function remove(id) {
  return prisma.poll.delete({
    where: { id }
  })
}

async function vote(pollId, optionId) {
  return prisma.$transaction(async (tx) => {
    await tx.pollOption.update({
      where: { id: optionId },
      data: {
        votes: {
          increment: 1
        }
      }
    })

    return tx.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true
      }
    })
  })
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  vote
}
