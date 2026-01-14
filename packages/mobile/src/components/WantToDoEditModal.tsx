import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from './CategoryIcon'
import { useWantToDoStore } from '@/stores/wantToDo'
import { WantToDo, WantToDoTiming } from '@/services/wantToDo'

const TIMING_OPTIONS: { value: WantToDoTiming; label: string; description: string }[] = [
  { value: 'THIS_WEEK', label: '今週', description: '今週の日曜まで' },
  { value: 'NEXT_WEEK', label: '来週', description: '来週の日曜まで' },
  { value: 'THIS_MONTH', label: '今月', description: '今月末まで' },
  { value: 'ANYTIME', label: 'いつでも', description: '3ヶ月間有効' },
]

const TIMING_LABELS: Record<string, string> = {
  THIS_WEEK: '今週',
  NEXT_WEEK: '来週',
  THIS_MONTH: '今月',
  ANYTIME: 'いつでも',
}

interface WantToDoEditModalProps {
  visible: boolean
  wantToDo: WantToDo | null
  onClose: () => void
  onSuccess?: () => void
  onDelete?: () => void
}

export function WantToDoEditModal({
  visible,
  wantToDo,
  onClose,
  onSuccess,
  onDelete,
}: WantToDoEditModalProps) {
  const insets = useSafeAreaInsets()
  const { editWantToDo, removeWantToDo } = useWantToDoStore()

  const [timing, setTiming] = useState<WantToDoTiming>('ANYTIME')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // モーダルが開かれたとき、またはwantToDoが変更されたときに状態を初期化
  useEffect(() => {
    if (wantToDo) {
      setTiming(wantToDo.timing)
      setComment(wantToDo.comment || '')
    }
  }, [wantToDo?.id]) // wantToDoのIDが変わった時のみ再初期化

  // モーダルが閉じられたときに状態をリセット
  useEffect(() => {
    if (!visible) {
      setIsSubmitting(false)
      setIsDeleting(false)
    }
  }, [visible])

  const handleSubmit = async () => {
    if (!wantToDo) return

    setIsSubmitting(true)
    try {
      await editWantToDo(wantToDo.id, {
        timing,
        comment: comment.trim() || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('WantToDo update error:', error)
      Alert.alert(
        'エラー',
        error.response?.data?.message || '更新に失敗しました'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!wantToDo) return

    Alert.alert(
      '確認',
      'この誘われ待ちを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            try {
              await removeWantToDo(wantToDo.id)
              onDelete?.()
              onClose()
            } catch (error: any) {
              console.error('WantToDo delete error:', error)
              Alert.alert('エラー', '削除に失敗しました')
            } finally {
              setIsDeleting(false)
            }
          },
        },
      ]
    )
  }

  if (!wantToDo) return null

  // 有効期限をフォーマット
  const formatExpiresAt = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}まで有効`
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.primary[400]} />
            </TouchableOpacity>
            <Text style={styles.title}>誘われ待ちを編集</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error[500]} />
              ) : (
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error[500]} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* カテゴリ表示（編集不可） */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>カテゴリ</Text>
              <View style={styles.categoryDisplay}>
                <CategoryIcon
                  name={wantToDo.category.icon}
                  size={28}
                  color={colors.accent[600]}
                />
                <Text style={styles.categoryDisplayName}>{wantToDo.category.name}</Text>
              </View>
              <Text style={styles.expiresAt}>{formatExpiresAt(wantToDo.expiresAt)}</Text>
            </View>

            {/* タイミング選択 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>いつ頃誘われたい？</Text>
              <View style={styles.timingGrid}>
                {TIMING_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.timingItem,
                      timing === option.value && styles.timingItemSelected,
                    ]}
                    onPress={() => setTiming(option.value)}
                  >
                    <Text
                      style={[
                        styles.timingLabel,
                        timing === option.value && styles.timingLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.timingDescription,
                        timing === option.value && styles.timingDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {timing !== wantToDo.timing && (
                <Text style={styles.timingNote}>
                  * タイミングを変更すると有効期限が更新されます
                </Text>
              )}
            </View>

            {/* コメント */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>コメント（任意）</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="例：初心者歓迎！気軽に誘ってください"
                placeholderTextColor={colors.primary[400]}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{comment.length}/200</Text>
            </View>
          </ScrollView>

          {/* フッター */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>変更を保存</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[900],
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: spacing.md,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[50],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  categoryDisplayName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent[700],
  },
  expiresAt: {
    fontSize: 12,
    color: colors.primary[500],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timingItem: {
    width: '48%',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timingItemSelected: {
    backgroundColor: colors.accent[50],
    borderColor: colors.accent[500],
  },
  timingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 4,
  },
  timingLabelSelected: {
    color: colors.accent[700],
  },
  timingDescription: {
    fontSize: 12,
    color: colors.primary[500],
  },
  timingDescriptionSelected: {
    color: colors.accent[600],
  },
  timingNote: {
    fontSize: 12,
    color: colors.accent[600],
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  commentInput: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.primary[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.primary[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.primary[100],
  },
  submitButton: {
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.primary[300],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
})
