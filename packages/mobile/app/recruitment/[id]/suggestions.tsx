import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useOfferStore } from '@/stores/offer'
import { SuggestedUser } from '@/services/offer'
import { colors, spacing } from '@/constants/theme'

export default function SuggestionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const {
    suggestions,
    isLoadingSuggestions,
    isSendingOffer,
    fetchSuggestions,
    sendOffer,
    clearSuggestions,
  } = useOfferStore()

  const [selectedUser, setSelectedUser] = useState<SuggestedUser | null>(null)
  const [offerMessage, setOfferMessage] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSuggestions(id)
    }
    return () => {
      clearSuggestions()
    }
  }, [id])

  const handleOpenOfferModal = (user: SuggestedUser) => {
    setSelectedUser(user)
    setOfferMessage('')
    setIsModalVisible(true)
  }

  const handleSendOffer = async () => {
    if (!id || !selectedUser) return

    try {
      await sendOffer(id, selectedUser.user.id, offerMessage || undefined)
      setIsModalVisible(false)
      Alert.alert('送信完了', `${selectedUser.user.nickname}さんにオファーを送信しました`)
    } catch (error: any) {
      Alert.alert('エラー', error.message || 'オファーの送信に失敗しました')
    }
  }

  const handleSkip = () => {
    router.replace(`/recruitment/${id}`)
  }

  const handleFinish = () => {
    router.replace(`/recruitment/${id}`)
  }

  const getTimingLabel = (timing: string) => {
    switch (timing) {
      case 'TODAY':
        return '今日'
      case 'THIS_WEEK':
        return '今週'
      case 'THIS_MONTH':
        return '今月'
      case 'ANYTIME':
        return 'いつでも'
      default:
        return timing
    }
  }

  const renderUserCard = ({ item }: { item: SuggestedUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.user.nickname.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.nickname}</Text>
          {item.hasActiveWantToDo && (
            <View style={styles.wantToDoIndicator}>
              <MaterialCommunityIcons name="hand-wave" size={12} color={colors.accent[600]} />
              <Text style={styles.wantToDoIndicatorText}>誘われ待ち中</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.offerButton}
          onPress={() => handleOpenOfferModal(item)}
        >
          <MaterialCommunityIcons name="send" size={16} color={colors.white} />
          <Text style={styles.offerButtonText}>オファー</Text>
        </TouchableOpacity>
      </View>

      {item.user.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {item.user.bio}
        </Text>
      )}

      {item.wantToDo && (
        <View style={styles.wantToDoCard}>
          <View style={styles.wantToDoHeader}>
            <MaterialCommunityIcons name="comment-text" size={14} color={colors.accent[600]} />
            <Text style={styles.wantToDoLabel}>やりたいこと表明中</Text>
            <View style={styles.timingBadge}>
              <Text style={styles.timingText}>{getTimingLabel(item.wantToDo.timing)}</Text>
            </View>
          </View>
          {item.wantToDo.comment && (
            <Text style={styles.wantToDoComment} numberOfLines={2}>
              {item.wantToDo.comment}
            </Text>
          )}
        </View>
      )}

      {item.matchedCategories.length > 0 && (
        <View style={styles.categoriesRow}>
          <Text style={styles.categoriesLabel}>興味:</Text>
          {item.matchedCategories.map((cat, index) => (
            <View key={index} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{cat}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'おすすめユーザー',
          headerBackTitle: '戻る',
          headerRight: () => (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>スキップ</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {isLoadingSuggestions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
          <Text style={styles.loadingText}>おすすめユーザーを検索中...</Text>
        </View>
      ) : suggestions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-search"
            size={64}
            color={colors.primary[300]}
          />
          <Text style={styles.emptyTitle}>おすすめユーザーが見つかりません</Text>
          <Text style={styles.emptyText}>
            同じカテゴリに興味があるユーザーがまだいないようです。{'\n'}
            募集を公開して応募を待ちましょう。
          </Text>
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>募集を確認する</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headerInfo}>
            <MaterialCommunityIcons name="lightbulb-on" size={20} color={colors.accent[600]} />
            <Text style={styles.headerInfoText}>
              同じカテゴリに興味があるユーザーです。{'\n'}
              オファーを送って誘ってみましょう！
            </Text>
          </View>

          <FlatList
            data={suggestions}
            renderItem={renderUserCard}
            keyExtractor={(item) => item.user.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={handleFinish}>
              <Text style={styles.doneButtonText}>完了</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* オファー送信モーダル */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>オファーを送信</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.primary[400]} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalUserInfo}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedUser.user.nickname.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.modalUserName}>{selectedUser.user.nickname}</Text>
              </View>
            )}

            <Text style={styles.modalLabel}>メッセージ（任意）</Text>
            <TextInput
              style={styles.messageInput}
              value={offerMessage}
              onChangeText={setOfferMessage}
              placeholder="参加してほしい理由や一言を添えてみましょう"
              placeholderTextColor={colors.primary[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.sendButton, isSendingOffer && styles.sendButtonDisabled]}
              onPress={handleSendOffer}
              disabled={isSendingOffer}
            >
              {isSendingOffer ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={18} color={colors.white} />
                  <Text style={styles.sendButtonText}>オファーを送信</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.primary[500],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[700],
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.primary[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  finishButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
  },
  finishButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accent[50],
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  headerInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.accent[700],
    lineHeight: 18,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[900],
  },
  wantToDoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  wantToDoIndicatorText: {
    fontSize: 12,
    color: colors.accent[600],
    fontWeight: '500',
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    gap: 4,
  },
  offerButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  bio: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.primary[600],
    lineHeight: 18,
  },
  wantToDoCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent[50],
    borderRadius: 8,
    padding: spacing.sm,
  },
  wantToDoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  wantToDoLabel: {
    fontSize: 12,
    color: colors.accent[700],
    fontWeight: '500',
    flex: 1,
  },
  timingBadge: {
    backgroundColor: colors.accent[100],
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: 4,
  },
  timingText: {
    fontSize: 10,
    color: colors.accent[700],
    fontWeight: '600',
  },
  wantToDoComment: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.accent[800],
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoriesLabel: {
    fontSize: 12,
    color: colors.primary[500],
    marginRight: spacing.xs,
  },
  categoryChip: {
    backgroundColor: colors.primary[100],
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  categoryChipText: {
    fontSize: 11,
    color: colors.primary[700],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.primary[200],
  },
  doneButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.primary[500],
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[900],
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  modalUserName: {
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[800],
  },
  modalLabel: {
    fontSize: 14,
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
