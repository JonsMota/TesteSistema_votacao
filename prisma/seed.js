const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const poll = await prisma.poll.create({
    data: {
      title: 'Qual stack você prefere?',
      startAt: new Date(),
      endAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      options: {
        create: [
          { text: 'Node.js' },
          { text: 'Laravel' },
          { text: 'Python' }
        ]
      }
    }
  })

  console.log('Seed criada:', poll.id)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
