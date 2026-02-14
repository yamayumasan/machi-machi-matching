/**
 * コンテンツフィルタリング（NGワード検出）
 *
 * UGCモデレーションの一環として、不適切なコンテンツをフィルタリングする
 */

// NGワードリスト（基本的な禁止語句）
const NG_WORDS: string[] = [
  // 暴力・脅迫
  '殺す',
  '死ね',
  '殺害',
  '暴力',
  // 差別・ヘイト
  '差別',
  // 詐欺・違法行為
  '詐欺',
  '違法',
  '犯罪',
  // 性的コンテンツ（明示的なもの）
  'セックス',
  '援交',
  '援助交際',
  'パパ活',
  // 薬物
  '覚せい剤',
  '覚醒剤',
  '大麻',
  '麻薬',
  // 個人情報要求
  'LINE交換',
  'ライン交換',
  '電話番号教えて',
  // 金銭詐取
  '振り込み',
  '送金して',
  '現金',
  'お金貸して',
  '借金',
]

// 正規表現パターン（より柔軟なマッチング用）
const NG_PATTERNS: RegExp[] = [
  // 出会い系誘導
  /出会[いィ]系/i,
  // LINE ID
  /line\s*id/i,
  /ライン\s*id/i,
  // 電話番号パターン（連絡先誘導）
  /電話番号/,
  /tel[：:]/i,
  // 金銭関連
  /\d+万円?(?:あげ|送|振)/,
]

export interface ContentCheckResult {
  isValid: boolean
  reason?: string
  matchedWord?: string
}

/**
 * テキストにNGワードが含まれているかチェック
 */
export function checkContent(text: string): ContentCheckResult {
  if (!text || text.trim().length === 0) {
    return { isValid: true }
  }

  const normalizedText = normalizeText(text)

  // NGワードリストチェック
  for (const word of NG_WORDS) {
    if (normalizedText.includes(normalizeText(word))) {
      return {
        isValid: false,
        reason: '不適切な表現が含まれています',
        matchedWord: word,
      }
    }
  }

  // 正規表現パターンチェック
  for (const pattern of NG_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return {
        isValid: false,
        reason: '不適切な表現が含まれています',
      }
    }
  }

  return { isValid: true }
}

/**
 * 複数フィールドをまとめてチェック
 */
export function checkMultipleContents(texts: (string | null | undefined)[]): ContentCheckResult {
  for (const text of texts) {
    if (text) {
      const result = checkContent(text)
      if (!result.isValid) {
        return result
      }
    }
  }
  return { isValid: true }
}

/**
 * テキストを正規化（全角→半角、大文字→小文字）
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // 全角英数→半角
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    // 全角スペース→半角
    .replace(/　/g, ' ')
    // 連続スペースを1つに
    .replace(/\s+/g, ' ')
    .trim()
}
