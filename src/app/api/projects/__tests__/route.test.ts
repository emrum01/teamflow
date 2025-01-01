import { describe, it, expect, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'
import { mockSession, cleanDatabase } from '@/test/setup'
import { NextResponse } from 'next/server'

describe('Projects API', () => {
  beforeEach(async () => {
    await cleanDatabase()

    // テストユーザーの作成
    await prisma.user.create({
      data: {
        id: mockSession.user.id,
        name: mockSession.user.name,
        email: mockSession.user.email,
      },
    })
  })

  describe('GET /api/projects', () => {
    it('ユーザーのプロジェクト一覧を取得できる', async () => {
      // テストプロジェクトの作成（プロジェクトメンバーを含む）
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
        include: {
          members: true,
        },
      })

      const response = await GET()
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe(project.id)
      expect(data[0].name).toBe('Test Project')
    })
  })

  describe('POST /api/projects', () => {
    it('新しいプロジェクトを作成できる', async () => {
      const request = new Request('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Project',
          description: 'New Description',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
      expect(data.name).toBe('New Project')
      expect(data.description).toBe('New Description')

      // データベースに保存されていることを確認
      const project = await prisma.project.findFirst({
        where: { name: 'New Project' },
        include: {
          members: true,
        },
      })

      expect(project).not.toBeNull()
      expect(project?.name).toBe('New Project')
      expect(project?.members[0].userId).toBe(mockSession.user.id)
      expect(project?.members[0].role).toBe('OWNER')
    })

    it('プロジェクト名が空の場合はエラーを返す', async () => {
      const request = new Request('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '',
          description: 'New Description',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
      expect(data.error).toBe('入力データが不正です')
    })
  })
}) 