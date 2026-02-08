import { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing } from '@/constants/theme'
import {
  reportUser,
  blockUser,
  ReportReason,
  ReportTarget,
  REPORT_REASON_LABELS,
} from '@/services/moderation'

interface ReportModalProps {
  visible: boolean
  onClose: () => void
  targetUserId: string
  targetUserName?: string
  targetType?: ReportTarget
  targetId?: string
}

const REPORT_REASONS: ReportReason[] = [
  'SPAM',
  'HARASSMENT',
  'INAPPROPRIATE_CONTENT',
  'FAKE_PROFILE',
  'OFFENSIVE_LANGUAGE',
  'OTHER',
]

export function ReportModal({
  visible,
  onClose,
  targetUserId,
  targetUserName,
  targetType = 'USER',
  targetId,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showBlockOption, setShowBlockOption] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('エラー', '報告理由を選択してください')
      return
    }

    setIsLoading(true)
    try {
      await reportUser({
        reportedUserId: targetUserId,
        targetType,
        targetId,
        reason: selectedReason,
        description: description.trim() || undefined,
      })

      setShowBlockOption(true)
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message || '報告の送信に失敗しました'
      Alert.alert('エラー', message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlock = async () => {
    setIsLoading(true)
    try {
      await blockUser(targetUserId)
      Alert.alert(
        '完了',
        `${targetUserName || 'ユーザー'}をブロックしました。今後このユーザーからのコンテンツは表示されません。`,
        [{ text: 'OK', onPress: handleClose }]
      )
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message || 'ブロックに失敗しました'
      Alert.alert('エラー', message)
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setDescription('')
    setShowBlockOption(false)
    onClose()
  }

  const handleSkipBlock = () => {
    Alert.alert(
      '報告完了',
      'ご報告いただきありがとうございます。内容を確認し、適切に対応いたします。',
      [{ text: 'OK', onPress: handleClose }]
    )
  }

  if (showBlockOption) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>報告を受け付けました</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.blockPromptText}>
                このユーザーをブロックしますか？{'\n'}
                ブロックすると、このユーザーからのメッセージや募集が表示されなくなります。
              </Text>

              <TouchableOpacity
                style={[styles.button, styles.blockButton]}
                onPress={handleBlock}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.blockButtonText}>ブロックする</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={handleSkipBlock}
                disabled={isLoading}
              >
                <Text style={styles.skipButtonText}>ブロックしない</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {targetUserName ? `${targetUserName}を報告` : 'ユーザーを報告'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.primary[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>報告理由</Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonItem,
                  selectedReason === reason && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <View style={styles.radioOuter}>
                  {selectedReason === reason && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {REPORT_REASON_LABELS[reason]}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>詳細（任意）</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="詳細を入力してください"
              placeholderTextColor={colors.primary[400]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                !selectedReason && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>報告を送信</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[900],
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  reasonItemSelected: {
    backgroundColor: colors.primary[50],
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  reasonText: {
    fontSize: 16,
    color: colors.primary[700],
  },
  reasonTextSelected: {
    color: colors.primary[900],
    fontWeight: '500',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.primary[900],
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  blockPromptText: {
    fontSize: 16,
    color: colors.primary[700],
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  blockButton: {
    backgroundColor: colors.error[500],
  },
  blockButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  skipButtonText: {
    color: colors.primary[700],
    fontSize: 16,
    fontWeight: '500',
  },
})
