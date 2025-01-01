const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // デモユーザーの作成
  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      emailVerified: new Date(),
    },
  })

  // デモプロジェクトの作成
  const demoProject = await prisma.project.create({
    data: {
      name: 'サンプルプロジェクト',
      description: 'これはデモ用のプロジェクトです。',
      members: {
        create: {
          role: 'OWNER',
          userId: demoUser.id,
        },
      },
    },
  })

  // サンプルタグの作成
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: '緊急', color: '#FF0000' },
    }),
    prisma.tag.create({
      data: { name: '重要', color: '#FFA500' },
    }),
    prisma.tag.create({
      data: { name: 'バグ', color: '#FF00FF' },
    }),
  ])

  // サンプルタスクの作成
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'プロジェクト設計',
        description: 'プロジェクトの基本設計を行う',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[1].id },
          ],
        },
      },
    }),
    prisma.task.create({
      data: {
        title: 'データベース構築',
        description: 'データベースのセットアップと初期データの投入',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2週間後
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
      },
    }),
  ])

  // コメントの作成
  await prisma.comment.create({
    data: {
      content: 'プロジェクト設計の方針を確認しました。',
      taskId: tasks[0].id,
      authorId: demoUser.id,
    },
  })

  console.log('シードデータの作成が完了しました。')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 