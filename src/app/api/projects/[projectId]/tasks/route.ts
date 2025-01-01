import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// タスク作成のバリデーションスキーマ
const createTaskSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'ON_HOLD']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

// プロジェクトへのアクセス権限をチェック
async function checkProjectAccess(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  })
  return member !== null
}

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const hasAccess = await checkProjectAccess(params.projectId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'このプロジェクトにアクセスする権限がありません' },
        { status: 403 }
      )
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: params.projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('タスク取得エラー:', error)
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const json = await request.json()

    try {
      const body = createTaskSchema.parse(json)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: '入力データが不正です', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    const hasAccess = await checkProjectAccess(params.projectId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'このプロジェクトにアクセスする権限がありません' },
        { status: 403 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title: json.title,
        description: json.description,
        status: json.status,
        priority: json.priority,
        dueDate: json.dueDate ? new Date(json.dueDate) : undefined,
        projectId: params.projectId,
        creatorId: session.user.id,
        assigneeId: json.assigneeId,
        tags: json.tagIds
          ? {
              create: json.tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('タスク作成エラー:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: '関連するリソースが見つかりません' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'タスクの作成に失敗しました' },
      { status: 500 }
    )
  }
} 