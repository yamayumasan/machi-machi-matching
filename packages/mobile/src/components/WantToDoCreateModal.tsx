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
import { useCategoryStore } from '@/stores/category'
import { useWantToDoStore } from '@/stores/wantToDo'
import { WantToDoTiming } from '@/services/wantToDo'

const TIMING_OPTIONS: { value: WantToDoTiming; label: string; description: string }[] = [
  { value: 'THIS_WEEK', label: '今週', description: '今週の日曜まで' },
  { value: 'NEXT_WEEK', label: '来週', description: '来週の日曜まで' },
  { value: 'THIS_MONTH', label: '今月', description: '今月末まで' },
  { value: 'ANYTIME', label: 'いつでも', description: '3ヶ月間有効' },
]

interface WantToDoCreateModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
  excludeCategoryIds?: string[]
}

export function WantToDoCreateModal({
  visible,
  onClose,
  onSuccess,
  excludeCategoryIds = [],
}: WantToDoCreateModalProps) {
  const insets = useSafeAreaInsets()
  const { categories, fetchCategories } = useCategoryStore()
  const { addWantToDo } = useWantToDoStore()

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [timing, setTiming] = useState<WantToDoTiming>('ANYTIME')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 利用可能なカテゴリ（既に登録済みのものを除外）
  const availableCategories = categories.filter(
    (c) => !excludeCategoryIds.includes(c.id)
  )

  useEffect(() => {
    if (visible) {
      fetchCategories()
      // 状態をリセット
      setSelectedCategoryId(null)
      setTiming('ANYTIME')
      setComment('')
    }
  }, [visible, fetchCategories])

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      Alert.alert('エラー', 'カテゴリを選択してください')
      return
    }

    setIsSubmitting(true)
    try {
      await addWantToDo({
        categoryId: selectedCategoryId,
        timing,
        comment: comment.trim() || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('WantToDo create error:', error)
      Alert.alert(
        'エラー',
        error.response?.data?.message || '誘われ待ちの登録に失敗しました'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.primary[400]} />
            </TouchableOpacity>
            <Text style={styles.title}>誘われ待ちを追加</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* カテゴリ選択 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>カテゴリを選択</Text>
              {availableCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    すべてのカテゴリで誘われ待ち中です
                  </Text>
                </View>
              ) : (
                <View style={styles.categoryGrid}>
                  {availableCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        selectedCategoryId === category.id && styles.categoryItemSelected,
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}
                    >
                      <CategoryIcon
                        name={category.icon}
                        size={24}
                        color={
                          selectedCategoryId === category.id
                            ? colors.accent[600]
                            : colors.primary[500]
                        }
                      />
                      <Text
                        style={[
                          styles.categoryName,
                          selectedCategoryId === category.id && styles.categoryNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
            {selectedCategory && (
              <View style={styles.preview}>
                <CategoryIcon name={selectedCategory.icon} size={20} color={colors.accent[600]} />
                <Text style={styles.previewText}>
                  「{selectedCategory.name}」で誘われ待ち中になります
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedCategoryId || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedCategoryId || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>誘われ待ちを追加</Text>
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
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.primary[500],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: colors.accent[50],
    borderColor: colors.accent[500],
  },
  categoryName: {
    fontSize: 12,
    color: colors.primary[600],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: colors.accent[700],
    fontWeight: '600',
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[50],
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  previewText: {
    fontSize: 13,
    color: colors.accent[700],
    flex: 1,
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
