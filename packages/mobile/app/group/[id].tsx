import { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, Stack } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useGroupStore } from '@/stores/group'
import { useAuthStore } from '@/stores/auth'
import { Message } from '@/services/group'
import { joinGroup, leaveGroup } from '@/services/socket'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const {
    currentGroup: group,
    messages,
    isLoading,
    fetchGroup,
    fetchMessages,
    sendMessage: sendMessageAction,
  } = useGroupStore()

  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (id) {
      fetchGroup(id)
      fetchMessages(id)
      // ソケットのグループルームに参加
      joinGroup(id)
    }

    return () => {
      if (id) {
        // ソケットのグループルームを退出
        leaveGroup(id)
      }
    }
  }, [id])

  const handleSend = async () => {
    if (!messageText.trim() || !id || isSending) return

    const text = messageText.trim()
    setMessageText('')
    setIsSending(true)

    try {
      await sendMessageAction(id, text)
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      setMessageText(text)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '今日'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日'
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    }
  }

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id
    const showDateHeader =
      index === 0 ||
      new Date(item.createdAt).toDateString() !==
        new Date(messages[index - 1].createdAt).toDateString()

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDateHeader(item.createdAt)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.sender.nickname.charAt(0)}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.messageContent}>
            {!isOwnMessage && (
              <Text style={styles.senderName}>{item.sender.nickname}</Text>
            )}
            <View
              style={[
                styles.messageBubble,
                isOwnMessage ? styles.ownBubble : styles.otherBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                ]}
              >
                {item.content}
              </Text>
            </View>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage && styles.ownMessageTime,
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </>
    )
  }

  // 現在のIDと一致しないグループデータは表示しない（チラつき防止）
  const isCorrectGroup = group?.id === id

  if (isLoading || !isCorrectGroup) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'チャット',
            headerBackTitle: '戻る',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: group?.recruitment.title || 'チャット',
          headerBackTitle: '戻る',
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* メンバー表示 */}
        {group && (
          <View style={styles.membersBar}>
            <CategoryIcon name={group.recruitment.category.icon} size={16} color={colors.accent[600]} />
            <Text style={styles.membersText}>
              {group.members.map((m) => m.nickname).join(', ')}
            </Text>
            <Text style={styles.membersCount}>{group.members.length}人</Text>
          </View>
        )}

        {/* メッセージ一覧 */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chat-outline" size={48} color={colors.primary[400]} />
            <Text style={styles.emptyText}>メッセージはまだありません</Text>
            <Text style={styles.emptySubText}>
              最初のメッセージを送ってみましょう
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* 入力欄 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="メッセージを入力..."
            placeholderTextColor={colors.primary[400]}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.sendButtonText}>送信</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  membersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[200],
  },
  membersIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  membersText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[600],
  },
  membersCount: {
    fontSize: 12,
    color: colors.primary[400],
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.primary[500],
    marginBottom: spacing.xs,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.primary[400],
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateHeaderText: {
    fontSize: 12,
    color: colors.primary[500],
    backgroundColor: colors.primary[200],
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  messageContent: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 12,
    color: colors.primary[500],
    marginBottom: 2,
    marginLeft: 4,
  },
  messageBubble: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: colors.accent[600],
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.primary[900],
  },
  messageTime: {
    fontSize: 11,
    color: colors.primary[400],
    marginTop: 4,
    marginLeft: 4,
  },
  ownMessageTime: {
    textAlign: 'right',
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.primary[200],
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.primary[900],
  },
  sendButton: {
    marginLeft: spacing.sm,
    backgroundColor: colors.primary[900],
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: colors.primary[300],
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
})
