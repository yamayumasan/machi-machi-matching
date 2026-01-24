import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActionSheetIOS,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth'
import { updateUser } from '@/services/auth'
import { pickImage, uploadAvatar } from '@/services/upload'
import { colors, spacing } from '@/constants/theme'

type AreaType = 'TOKYO' | 'SENDAI'

export default function EditProfileScreen() {
  const { user, fetchUser } = useAuthStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null)
  const [form, setForm] = useState({
    nickname: user?.nickname || '',
    bio: user?.bio || '',
    area: (user?.area || 'TOKYO') as AreaType,
  })

  const updateForm = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = (): string | null => {
    if (!form.nickname.trim()) {
      return 'ニックネームを入力してください'
    }
    if (form.nickname.length < 2) {
      return 'ニックネームは2文字以上で入力してください'
    }
    return null
  }

  // アバター画像を選択
  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['キャンセル', '写真を撮る', 'ライブラリから選択'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await selectImage('camera')
          } else if (buttonIndex === 2) {
            await selectImage('library')
          }
        }
      )
    } else {
      Alert.alert(
        'プロフィール画像',
        '画像の取得方法を選択してください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '写真を撮る', onPress: () => selectImage('camera') },
          { text: 'ライブラリから選択', onPress: () => selectImage('library') },
        ]
      )
    }
  }

  const selectImage = async (source: 'camera' | 'library') => {
    try {
      setIsUploadingAvatar(true)
      const asset = await pickImage(source)
      if (asset) {
        // 選択した画像をプレビュー表示
        setAvatarUri(asset.uri)
        // サーバーにアップロード
        const uploadedUrl = await uploadAvatar(asset.uri)
        setAvatarUri(uploadedUrl)
        // ユーザー情報を更新
        await updateUser({ avatar: uploadedUrl })
        await fetchUser()
      }
    } catch (error: any) {
      Alert.alert('エラー', error.message || '画像のアップロードに失敗しました')
      // エラー時は元の画像に戻す
      setAvatarUri(user?.avatar || null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async () => {
    const error = validateForm()
    if (error) {
      Alert.alert('入力エラー', error)
      return
    }

    if (!user) return

    setIsSubmitting(true)
    try {
      await updateUser({
        nickname: form.nickname.trim(),
        bio: form.bio.trim() || undefined,
        area: form.area,
      })
      await fetchUser()
      Alert.alert('更新完了', 'プロフィールを更新しました', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (error: any) {
      Alert.alert('エラー', error.message || 'プロフィールの更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'プロフィール編集',
          headerBackTitle: '戻る',
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <ScrollView style={styles.scrollView}>
            {/* アバター */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarTouchable}
                onPress={handleAvatarPress}
                disabled={isUploadingAvatar}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {form.nickname?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                {isUploadingAvatar ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                ) : (
                  <View style={styles.avatarEditBadge}>
                    <MaterialCommunityIcons name="camera" size={14} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.avatarHint}>
                タップして画像を変更
              </Text>
            </View>

            {/* ニックネーム */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ニックネーム *</Text>
              <TextInput
                style={styles.input}
                value={form.nickname}
                onChangeText={(v) => updateForm('nickname', v)}
                placeholder="表示名を入力"
                placeholderTextColor={colors.primary[400]}
                maxLength={20}
              />
              <Text style={styles.charCount}>{form.nickname.length}/20</Text>
            </View>

            {/* 自己紹介 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>自己紹介</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.bio}
                onChangeText={(v) => updateForm('bio', v)}
                placeholder="自己紹介を入力してください"
                placeholderTextColor={colors.primary[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.charCount}>{form.bio.length}/200</Text>
            </View>

            {/* エリア */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活動エリア *</Text>
              <View style={styles.areaRow}>
                {(['TOKYO', 'SENDAI'] as AreaType[]).map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.areaChip,
                      form.area === area && styles.areaChipActive,
                    ]}
                    onPress={() => updateForm('area', area)}
                  >
                    <Text
                      style={[
                        styles.areaText,
                        form.area === area && styles.areaTextActive,
                      ]}
                    >
                      {area === 'TOKYO' ? '東京' : '仙台'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* 保存ボタン */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>保存する</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarHint: {
    fontSize: 12,
    color: colors.primary[400],
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 15,
    color: colors.primary[900],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: colors.primary[400],
    textAlign: 'right',
    marginTop: 4,
  },
  areaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  areaChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
  },
  areaChipActive: {
    backgroundColor: colors.primary[500],
  },
  areaText: {
    fontSize: 15,
    color: colors.primary[600],
    fontWeight: '500',
  },
  areaTextActive: {
    color: colors.white,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.primary[200],
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
