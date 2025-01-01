import { describe, it, expect, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'
import { mockSession } from '@/test/setup'
import { NextResponse } from 'next/server'

describe('Tasks API', () => {
  let projectId: string

  beforeEach(async () => {
    // テストユーザーの作成
    await prisma.user.upsert({
      where: { id: mockSession.user.id },
      update: {},
      create: {
        id: mockSession.user.id,
        name: mockSession.user.name,
        email: mockSession.user.email,
      },
    })

    // テストプロジェクトの作成
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Test Description',
        members: {
          create: {
            userId: mockSession.user.id,
            role: 'OWNER',
          },
        },
      },
    })
    projectId = project.id
  })

  describe('GET /api/projects/[projectId]/tasks', () => {
    it('プロジェクトのタスク一覧を取得できる', async () => {
      // テストタスクの作成
      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          description: 'Test Description',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId,
          creatorId: mockSession.user.id,
        },
      })

      const params = { projectId }
      const response = await GET(new Request('http://localhost:3000'), { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(task.id)
      expect(data[0].title).toBe('Test Task')
    })

    it('アクセス権限がない場合はエラーを返す', async () => {
      // 別のプロジェクトを作成（メンバーではない）
      const otherProject = await prisma.project.create({
        data: {
          name: 'Other Project',
          description: 'Other Description',
        },
      })

      const params = { projectId: otherProject.id }
      const response = await GET(new Request('http://localhost:3000'), { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(403)
      expect(data.error).toBe('このプロジェクトにアクセスする権限がありません')
    })
  })

  describe('POST /api/projects/[projectId]/tasks', () => {
    it('新しいタスクを作成できる', async () => {
      const request = new Request('http://localhost:3000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Task',
          description: 'New Description',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date().toISOString(),
        }),
      })

      const params = { projectId }
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
      expect(data.title).toBe('New Task')
      expect(data.status).toBe('TODO')
      expect(data.priority).toBe('HIGH')

      // データベースに保存されていることを確認
      const task = await prisma.task.findFirst({
        where: {
          title: 'New Task',
          projectId,
        },
      })

      expect(task).not.toBeNull()
      expect(task?.title).toBe('New Task')
      expect(task?.creatorId).toBe(mockSession.user.id)
    })

    it('タイトルが空の場合はエラーを返す', async () => {
      const request = new Request('http://localhost:3000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '',
          status: 'TODO',
        }),
      })

      const params = { projectId }
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
      expect(data.error).toBe('入力データが不正です')
    })
  })
}) 