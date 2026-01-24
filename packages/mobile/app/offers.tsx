import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useOfferStore } from '@/stores/offer'
import { Offer } from '@/services/offer'
import { CategoryIcon } from '@/components/CategoryIcon'
import { colors, spacing } from '@/constants/theme'

export default function OffersScreen() {
  const {
    receivedOffers,
    isLoadingOffers,
    isRespondingOffer,
    fetchReceivedOffers,
    respondToOffer,
  } = useOfferStore()

  const [refreshing, setRefreshing] = useState(false)
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null)

  useEffect(() => {
    fetchReceivedOffers()
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchReceivedOffers()
    setRefreshing(false)
  }, [])

  const handleRespond = async (offer: Offer, action: 'ACCEPT' | 'DECLINE') => {
    const actionText = action === 'ACCEPT' ? '参加' : 'パス'
    const confirmText =
      action === 'ACCEPT'
        ? `${offer.recruitment.title}への参加を承諾しますか？`
        : 'このオファーをパスしますか？'

    Alert.alert(actionText, confirmText, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: actionText,
        style: action === 'DECLINE' ? 'destructive' : 'default',
        onPress: async () => {
          setProcessingOfferId(offer.id)
          try {
            await respondToOffer(offer.recruitment.id, offer.id, action)
            if (action === 'ACCEPT') {
              Alert.alert('参加確定', '募集への参加が確定しました！募集詳細を確認してください。', [
                {
                  text: '募集を見る',
                  onPress: () => router.push(`/recruitment/${offer.recruitment.id}`),
                },
                { text: '閉じる' },
              ])
            }
          } catch (error: any) {
            Alert.alert('エラー', error.message || '処理に失敗しました')
          } finally {
            setProcessingOfferId(null)
          }
        },
      },
    ])
  }

  const pendingOffers = receivedOffers.filter((o) => o.status === 'PENDING')
  const respondedOffers = receivedOffers.filter((o) => o.status !== 'PENDING')

  const renderOfferCard = ({ item }: { item: Offer }) => {
    const isProcessing = processingOfferId === item.id
    const isPending = item.status === 'PENDING'

    return (
      <TouchableOpacity
        style={styles.offerCard}
        onPress={() => router.push(`/recruitment/${item.recruitment.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <CategoryIcon
              name={item.recruitment.category.icon}
              size={14}
              color={colors.primary[700]}
            />
            <Text style={styles.categoryName}>{item.recruitment.category.name}</Text>
          </View>
          {!isPending && (
            <View
              style={[
                styles.statusBadge,
                item.status === 'ACCEPTED' && styles.acceptedBadge,
                item.status === 'DECLINED' && styles.declinedBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === 'ACCEPTED' && styles.acceptedText,
                  item.status === 'DECLINED' && styles.declinedText,
                ]}
              >
                {item.status === 'ACCEPTED' ? '参加済み' : 'パス'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.recruitmentTitle}>{item.recruitment.title}</Text>

        <View style={styles.creatorRow}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorAvatarText}>
              {item.recruitment.creator.nickname.charAt(0)}
            </Text>
          </View>
          <Text style={styles.creatorName}>{item.recruitment.creator.nickname}</Text>
          <Text style={styles.fromText}>さんからのオファー</Text>
        </View>

        {item.message && (
          <View style={styles.messageBox}>
            <MaterialCommunityIcons name="message-text" size={14} color={colors.primary[500]} />
            <Text style={styles.messageText} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        )}

        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>

        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleRespond(item, 'DECLINE')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <>
                  <MaterialCommunityIcons name="close" size={16} color={colors.primary[600]} />
                  <Text style={styles.declineButtonText}>パス</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleRespond(item, 'ACCEPT')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={16} color={colors.white} />
                  <Text style={styles.acceptButtonText}>参加する</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '受け取ったオファー',
          headerBackTitle: '戻る',
        }}
      />

      {isLoadingOffers && receivedOffers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      ) : receivedOffers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="email-open" size={64} color={colors.primary[300]} />
          <Text style={styles.emptyTitle}>オファーはまだありません</Text>
          <Text style={styles.emptyText}>
            「やりたいこと」を表明しておくと、{'\n'}
            オファーが届きやすくなります。
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...pendingOffers, ...respondedOffers]}
          renderItem={renderOfferCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            pendingOffers.length > 0 ? (
              renderSectionHeader('未対応', pendingOffers.length)
            ) : null
          }
          stickyHeaderIndices={pendingOffers.length > 0 ? [0] : []}
        />
      )}
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
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.primary[50],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  countBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.accent[500],
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  offerCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    gap: 4,
  },
  categoryName: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
  },
  acceptedBadge: {
    backgroundColor: colors.accent[100],
  },
  declinedBadge: {
    backgroundColor: colors.primary[100],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[500],
  },
  acceptedText: {
    color: colors.accent[700],
  },
  declinedText: {
    color: colors.primary[500],
  },
  recruitmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[900],
    marginBottom: spacing.sm,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  creatorName: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[700],
  },
  fromText: {
    fontSize: 13,
    color: colors.primary[500],
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[600],
    lineHeight: 18,
  },
  dateText: {
    fontSize: 12,
    color: colors.primary[400],
    marginBottom: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.primary[100],
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[300],
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent[600],
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
})
