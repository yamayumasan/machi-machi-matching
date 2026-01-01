import { prisma } from '../lib/prisma'

/**
 * 期限切れの募集を自動で締め切りにする
 * - datetimeが過ぎた募集をCLOSEDに変更
 */
export async function closeExpiredRecruitments(): Promise<number> {
  const now = new Date()

  const result = await prisma.recruitment.updateMany({
    where: {
      status: 'OPEN',
      datetime: {
        lt: now,
        not: null,
      },
    },
    data: {
      status: 'CLOSED',
    },
  })

  if (result.count > 0) {
    console.log(`[Scheduler] Closed ${result.count} expired recruitments`)
  }

  return result.count
}

/**
 * 期限切れのやりたいこと表明を自動でEXPIREDに変更
 */
export async function expireOldWantToDos(): Promise<number> {
  const now = new Date()

  const result = await prisma.wantToDo.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: {
        lt: now,
      },
    },
    data: {
      status: 'EXPIRED',
    },
  })

  if (result.count > 0) {
    console.log(`[Scheduler] Expired ${result.count} want-to-dos`)
  }

  return result.count
}

/**
 * 定期実行するスケジューラー
 * 1分ごとに実行
 */
let schedulerInterval: ReturnType<typeof setInterval> | null = null

export function startScheduler(): void {
  if (schedulerInterval) {
    console.log('[Scheduler] Already running')
    return
  }

  console.log('[Scheduler] Starting...')

  // 起動時に一度実行
  runScheduledTasks()

  // 1分ごとに実行
  schedulerInterval = setInterval(runScheduledTasks, 60 * 1000)
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('[Scheduler] Stopped')
  }
}

async function runScheduledTasks(): Promise<void> {
  try {
    await Promise.all([
      closeExpiredRecruitments(),
      expireOldWantToDos(),
    ])
  } catch (error) {
    console.error('[Scheduler] Error running scheduled tasks:', error)
  }
}
