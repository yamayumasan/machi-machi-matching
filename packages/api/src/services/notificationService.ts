import { NotificationType } from '@prisma/client'
import { prisma } from '../lib/prisma'

interface NotificationData {
  recruitmentId?: string
  recruitmentTitle?: string
  applicationId?: string
  offerId?: string
  groupId?: string
  groupName?: string
  messageId?: string
  senderId?: string
  senderNickname?: string
  newMemberId?: string
  newMemberNickname?: string
  type?: string
}

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
}

/**
 * Expo Push APIでプッシュ通知を送信
 */
async function sendPushNotification(message: ExpoPushMessage): Promise<void> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()
    if (result.data?.status === 'error') {
      console.error('Push notification error:', result.data.message)
    }
  } catch (error) {
    console.error('Failed to send push notification:', error)
  }
}

/**
 * ユーザーにプッシュ通知を送信
 */
async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  })

  if (user?.pushToken) {
    await sendPushNotification({
      to: user.pushToken,
      title,
      body,
      data: data as Record<string, unknown> | undefined,
      sound: 'default',
    })
  }
}

/**
 * 複数ユーザーにプッシュ通知を送信
 */
async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { pushToken: true },
  })

  const tokens = users.filter((u) => u.pushToken).map((u) => u.pushToken as string)

  await Promise.all(
    tokens.map((token) =>
      sendPushNotification({
        to: token,
        title,
        body,
        data: data as Record<string, unknown> | undefined,
        sound: 'default',
      })
    )
  )
}

/**
 * 通知を作成する（アプリ内通知 + プッシュ通知）
 */
async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: NotificationData
) {
  // アプリ内通知を作成
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data ? (data as object) : undefined,
    },
  })

  // プッシュ通知を送信
  await sendPushToUser(userId, title, body, { ...data, type })

  return notification
}

/**
 * 参加申請を受信した時の通知（募集者向け）
 */
export async function notifyApplicationReceived(
  recruitmentCreatorId: string,
  applicantNickname: string,
  recruitmentId: string,
  recruitmentTitle: string,
  applicationId: string
) {
  return createNotification(
    recruitmentCreatorId,
    'APPLICATION_RECEIVED',
    '参加申請が届きました',
    `${applicantNickname}さんから「${recruitmentTitle}」への参加申請が届きました`,
    { recruitmentId, recruitmentTitle, applicationId }
  )
}

/**
 * 参加申請が承認された時の通知（申請者向け）
 */
export async function notifyApplicationApproved(
  applicantId: string,
  recruitmentId: string,
  recruitmentTitle: string,
  applicationId: string,
  groupId?: string
) {
  return createNotification(
    applicantId,
    'APPLICATION_APPROVED',
    '参加申請が承認されました',
    `「${recruitmentTitle}」への参加申請が承認されました。グループチャットで詳細を話し合いましょう！`,
    { recruitmentId, recruitmentTitle, applicationId, groupId }
  )
}

/**
 * 参加申請が却下された時の通知（申請者向け）
 */
export async function notifyApplicationRejected(
  applicantId: string,
  recruitmentId: string,
  recruitmentTitle: string,
  applicationId: string
) {
  return createNotification(
    applicantId,
    'APPLICATION_REJECTED',
    '参加申請が見送りになりました',
    `「${recruitmentTitle}」への参加申請は見送りとなりました`,
    { recruitmentId, recruitmentTitle, applicationId }
  )
}

/**
 * オファーを受信した時の通知（受信者向け）
 */
export async function notifyOfferReceived(
  receiverId: string,
  senderNickname: string,
  recruitmentId: string,
  recruitmentTitle: string,
  offerId: string
) {
  return createNotification(
    receiverId,
    'OFFER_RECEIVED',
    'オファーが届きました',
    `${senderNickname}さんから「${recruitmentTitle}」へのお誘いが届きました`,
    { recruitmentId, recruitmentTitle, offerId, senderNickname }
  )
}

/**
 * オファーが承諾された時の通知（送信者向け）
 */
export async function notifyOfferAccepted(
  senderId: string,
  receiverNickname: string,
  recruitmentId: string,
  recruitmentTitle: string,
  offerId: string
) {
  return createNotification(
    senderId,
    'OFFER_ACCEPTED',
    'オファーが承諾されました',
    `${receiverNickname}さんが「${recruitmentTitle}」への参加を承諾しました`,
    { recruitmentId, recruitmentTitle, offerId }
  )
}

/**
 * オファーが辞退された時の通知（送信者向け）
 */
export async function notifyOfferDeclined(
  senderId: string,
  receiverNickname: string,
  recruitmentId: string,
  recruitmentTitle: string,
  offerId: string
) {
  return createNotification(
    senderId,
    'OFFER_DECLINED',
    'オファーが辞退されました',
    `${receiverNickname}さんは「${recruitmentTitle}」への参加を辞退しました`,
    { recruitmentId, recruitmentTitle, offerId }
  )
}

/**
 * グループが作成された時の通知（メンバー向け）
 */
export async function notifyGroupCreated(
  memberIds: string[],
  groupId: string,
  groupName: string,
  recruitmentId: string
) {
  const title = 'グループが作成されました'
  const body = `「${groupName}」グループが作成されました。チャットで詳細を話し合いましょう！`
  const data = { groupId, groupName, recruitmentId }

  const notifications = memberIds.map((userId) => ({
    userId,
    type: 'GROUP_CREATED' as NotificationType,
    title,
    body,
    data,
  }))

  // アプリ内通知を作成
  await prisma.notification.createMany({
    data: notifications,
  })

  // プッシュ通知を送信
  await sendPushToUsers(memberIds, title, body, { ...data, type: 'GROUP_CREATED' })
}

/**
 * 新しいメッセージが送信された時の通知（送信者以外のメンバー向け）
 */
export async function notifyNewMessage(
  memberIds: string[],
  senderId: string,
  senderNickname: string,
  groupId: string,
  groupName: string,
  messagePreview: string
) {
  // 送信者を除外
  const recipientIds = memberIds.filter((id) => id !== senderId)

  if (recipientIds.length === 0) return

  const title = `${groupName}に新しいメッセージ`
  const body = `${senderNickname}: ${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? '...' : ''}`
  const data = { groupId, groupName, senderId, senderNickname }

  const notifications = recipientIds.map((userId) => ({
    userId,
    type: 'NEW_MESSAGE' as NotificationType,
    title,
    body,
    data,
  }))

  // アプリ内通知を作成
  await prisma.notification.createMany({
    data: notifications,
  })

  // プッシュ通知を送信
  await sendPushToUsers(recipientIds, title, body, { ...data, type: 'NEW_MESSAGE' })
}

/**
 * メンバーがグループに参加した時の通知（既存メンバー向け）
 */
export async function notifyMemberJoined(
  existingMemberIds: string[],
  newMemberId: string,
  newMemberNickname: string,
  groupId: string,
  groupName: string
) {
  // 新規メンバー自身を除外
  const recipientIds = existingMemberIds.filter((id) => id !== newMemberId)

  if (recipientIds.length === 0) return

  const title = '新しいメンバーが参加しました'
  const body = `${newMemberNickname}さんが「${groupName}」に参加しました`
  const data = { groupId, groupName, newMemberId, newMemberNickname }

  const notifications = recipientIds.map((userId) => ({
    userId,
    type: 'MEMBER_JOINED' as NotificationType,
    title,
    body,
    data,
  }))

  // アプリ内通知を作成
  await prisma.notification.createMany({
    data: notifications,
  })

  // プッシュ通知を送信
  await sendPushToUsers(recipientIds, title, body, { ...data, type: 'MEMBER_JOINED' })
}

/**
 * やりたいこと表明にマッチする募集があった時の通知
 */
export async function notifyRecruitmentMatch(
  userId: string,
  recruitmentId: string,
  recruitmentTitle: string,
  categoryName: string
) {
  return createNotification(
    userId,
    'RECRUITMENT_MATCH',
    'マッチする募集があります',
    `あなたの「${categoryName}」の表明にマッチする募集「${recruitmentTitle}」があります`,
    { recruitmentId, recruitmentTitle }
  )
}
