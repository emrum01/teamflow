import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { prisma } from '@/lib/prisma'

expect.extend(matchers)

// モックセッションデータ
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// next-authのモック
vi.mock('next-auth', () => {
  return {
    getServerSession: vi.fn(() => Promise.resolve(mockSession)),
    default: vi.fn(() => Promise.resolve(mockSession)),
  }
})

vi.mock('next-auth/next', () => {
  return {
    default: vi.fn(() => Promise.resolve(mockSession)),
  }
})

// データベースのクリーンアップ
export async function cleanDatabase() {
  // 依存関係の順序に従って削除
  await prisma.taskTag.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
}

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await cleanDatabase()
  await prisma.$disconnect()
})

beforeEach(async () => {
  await cleanDatabase()
})

afterEach(async () => {
  cleanup()
  await cleanDatabase()
}) 