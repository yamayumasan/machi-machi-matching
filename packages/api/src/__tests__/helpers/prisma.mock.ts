import { jest } from '@jest/globals'
import type { PrismaClient } from '@prisma/client'

// Prismaのモック用型定義
type MockPrismaClient = {
  [K in keyof PrismaClient]: K extends '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    ? jest.Mock
    : {
        findUnique: jest.Mock
        findFirst: jest.Mock
        findMany: jest.Mock
        create: jest.Mock
        createMany: jest.Mock
        update: jest.Mock
        updateMany: jest.Mock
        delete: jest.Mock
        deleteMany: jest.Mock
        count: jest.Mock
        aggregate: jest.Mock
        upsert: jest.Mock
      }
}

// モックPrismaクライアントを作成
export function createMockPrismaClient(): MockPrismaClient {
  const modelMock = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    upsert: jest.fn(),
  })

  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $transaction: jest.fn(),
    $use: jest.fn(),
    $extends: jest.fn(),
    user: modelMock(),
    category: modelMock(),
    wantToDo: modelMock(),
    recruitment: modelMock(),
    application: modelMock(),
    offer: modelMock(),
    group: modelMock(),
    groupMember: modelMock(),
    message: modelMock(),
    notification: modelMock(),
    report: modelMock(),
    block: modelMock(),
  } as unknown as MockPrismaClient
}

// シングルトンモックインスタンス
export const mockPrisma = createMockPrismaClient()

// Prismaモジュールをモック
export function setupPrismaMock() {
  jest.unstable_mockModule('../../lib/prisma.js', () => ({
    prisma: mockPrisma,
  }))
}
