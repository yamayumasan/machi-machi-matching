import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL || 'admin@example.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@machimachi-matching.com'

interface ReportNotificationParams {
  reporterId: string
  reporterName: string | null
  targetType: 'USER' | 'RECRUITMENT' | 'MESSAGE'
  targetId: string
  targetName?: string
  reason: string
  createdAt: Date
}

interface BlockNotificationParams {
  blockerId: string
  blockerName: string | null
  blockedUserId: string
  blockedUserName: string | null
  createdAt: Date
}

/**
 * 報告作成時に開発者へメール通知
 */
export async function notifyDeveloperOfReport(params: ReportNotificationParams): Promise<void> {
  if (!resend) {
    console.warn('[EmailService] Resend not configured, skipping email notification')
    return
  }

  const targetTypeLabel = {
    USER: 'ユーザー',
    RECRUITMENT: '募集',
    MESSAGE: 'メッセージ',
  }[params.targetType]

  const subject = `[報告通知] ${targetTypeLabel}が報告されました`

  const html = `
    <h2>新しい報告が作成されました</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">報告種別</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${targetTypeLabel}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">報告者</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.reporterName || '不明'} (ID: ${params.reporterId})</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">対象ID</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.targetId}</td>
      </tr>
      ${
        params.targetName
          ? `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">対象名</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.targetName}</td>
      </tr>
      `
          : ''
      }
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">報告理由</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.reason}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">報告日時</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</td>
      </tr>
    </table>
    <p style="margin-top: 16px; color: #666;">
      このメールはマチマチマッチングアプリの自動通知です。
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: DEVELOPER_EMAIL,
      subject,
      html,
    })
    console.log(`[EmailService] Report notification sent to ${DEVELOPER_EMAIL}`)
  } catch (error) {
    console.error('[EmailService] Failed to send report notification:', error)
  }
}

/**
 * ブロック作成時に開発者へメール通知
 */
export async function notifyDeveloperOfBlock(params: BlockNotificationParams): Promise<void> {
  if (!resend) {
    console.warn('[EmailService] Resend not configured, skipping email notification')
    return
  }

  const subject = '[ブロック通知] ユーザーがブロックされました'

  const html = `
    <h2>新しいブロックが作成されました</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">ブロックしたユーザー</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.blockerName || '不明'} (ID: ${params.blockerId})</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">ブロックされたユーザー</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.blockedUserName || '不明'} (ID: ${params.blockedUserId})</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">ブロック日時</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${params.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</td>
      </tr>
    </table>
    <p style="margin-top: 16px; color: #666;">
      このメールはマチマチマッチングアプリの自動通知です。
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: DEVELOPER_EMAIL,
      subject,
      html,
    })
    console.log(`[EmailService] Block notification sent to ${DEVELOPER_EMAIL}`)
  } catch (error) {
    console.error('[EmailService] Failed to send block notification:', error)
  }
}
