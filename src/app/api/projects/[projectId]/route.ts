import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

// プロジェクト更新のバリデーションスキーマ
const updateProjectSchema = z.object({
  name: z.string().min(1, '名前は必須です').optional(),
  description: z.string().optional(),
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

    const project = await prisma.project.findUnique({
      where: {
        id: params.projectId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('プロジェクト取得エラー:', error)
    return NextResponse.json(
      { error: 'プロジェクトの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const json = await request.json()
    const body = updateProjectSchema.parse(json)

    const project = await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: {
        name: body.name,
        description: body.description,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.errors },
        { status: 400 }
      )
    }

    console.error('プロジェクト更新エラー:', error)
    return NextResponse.json(
      { error: 'プロジェクトの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: session.user.id,
        },
      },
    })

    if (!member || member.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'プロジェクトを削除する権限がありません' },
        { status: 403 }
      )
    }

    await prisma.project.delete({
      where: {
        id: params.projectId,
      },
    })

    return NextResponse.json({ message: 'プロジェクトを削除しました' })
  } catch (error) {
    console.error('プロジェクト削除エラー:', error)
    return NextResponse.json(
      { error: 'プロジェクトの削除に失敗しました' },
      { status: 500 }
    )
  }
} 