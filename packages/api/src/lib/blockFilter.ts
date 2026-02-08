import { prisma } from './prisma'

/**
 * ブロック関係にあるユーザーIDを取得
 * - 自分がブロックしたユーザー
 * - 自分をブロックしているユーザー
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const [blockedByMe, blockedMe] = await Promise.all([
    // 自分がブロックしたユーザー
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedUserId: true },
    }),
    // 自分をブロックしているユーザー
    prisma.block.findMany({
      where: { blockedUserId: userId },
      select: { blockerId: true },
    }),
  ])

  const blockedUserIds = new Set<string>([
    ...blockedByMe.map((b) => b.blockedUserId),
    ...blockedMe.map((b) => b.blockerId),
  ])

  return Array.from(blockedUserIds)
}

/**
 * ブロックフィルターを適用したwhere条件を生成
 */
export function excludeBlockedUsers(
  blockedUserIds: string[],
  userIdField: string = 'creatorId'
): { [key: string]: { notIn: string[] } } | {} {
  if (blockedUserIds.length === 0) {
    return {}
  }
  return {
    [userIdField]: { notIn: blockedUserIds },
  }
}
