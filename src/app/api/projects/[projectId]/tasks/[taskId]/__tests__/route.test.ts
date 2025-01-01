import { describe, it, expect, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '../route'
import { prisma } from '@/lib/prisma'
import { mockSession, cleanDatabase } from '@/test/setup'
import { NextResponse } from 'next/server'

describe('Task API', () => {
  let projectId: string
  let taskId: string
  let userId: string

  beforeEach(async () => {
    await cleanDatabase()

    // テストユーザーの作成
    const user = await prisma.user.create({
      data: {
        id: mockSession.user.id,
        name: mockSession.user.name,
        email: mockSession.user.email,
      },
    })
    userId = user.id

    // テストプロジェクトの作成（プロジェクトメンバーを含む）
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Test Description',
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    })
    projectId = project.id

    // テストタスクの作成
    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        description: 'Test Description',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId,
        creatorId: user.id,
      },
    })
    taskId = task.id
  })

  describe('GET /api/projects/[projectId]/tasks/[taskId]', () => {
    it('タスクの詳細を取得できる', async () => {
      const params = { projectId, taskId }
      const response = await GET(new Request('http://localhost:3000'), { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
      expect(data.id).toBe(taskId)
      expect(data.title).toBe('Test Task')
    })

    it('存在しないタスクの場合はエラーを返す', async () => {
      const params = { projectId, taskId: 'non-existent-id' }
      const response = await GET(new Request('http://localhost:3000'), { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(404)
      expect(data.error).toBe('タスクが見つかりません')
    })
  })

  describe('PATCH /api/projects/[projectId]/tasks/[taskId]', () => {
    it('タスクを更新できる', async () => {
      const request = new Request('http://localhost:3000', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Updated Task',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        }),
      })

      const params = { projectId, taskId }
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
      expect(data.title).toBe('Updated Task')
      expect(data.status).toBe('IN_PROGRESS')
      expect(data.priority).toBe('HIGH')
    })
  })

  describe('DELETE /api/projects/[projectId]/tasks/[taskId]', () => {
    it('アクセス権限がない場合はエラーを返す', async () => {
      // 別のプロジェクトを作成（プロジェクトメンバーなし）
      const otherProject = await prisma.project.create({
        data: {
          name: 'Other Project',
          description: 'Other Description',
        },
      })

      // 別のタスクを作成
      const otherTask = await prisma.task.create({
        data: {
          title: 'Other Task',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: otherProject.id,
          creatorId: userId,
        },
      })

      const params = { projectId: otherProject.id, taskId: otherTask.id }
      const response = await DELETE(new Request('http://localhost:3000'), { params })
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(403)
      expect(data.error).toBe('このプロジェクトにアクセスする権限がありません')
    })
  })
}) 