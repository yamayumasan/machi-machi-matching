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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { updateUser } from '@/services/auth'
import { colors, spacing } from '@/constants/theme'

type AreaType = 'TOKYO' | 'SENDAI'

export default function EditProfileScreen() {
  const { user, fetchUser } = useAuthStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
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
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {form.nickname?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={styles.avatarHint}>
                アバター画像は今後対応予定です
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
                placeholderTextColor={colors.gray[400]}
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
                placeholderTextColor={colors.gray[400]}
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
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  avatarHint: {
    fontSize: 12,
    color: colors.gray[400],
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 15,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: colors.gray[400],
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
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  areaChipActive: {
    backgroundColor: colors.primary[500],
  },
  areaText: {
    fontSize: 15,
    color: colors.gray[600],
    fontWeight: '500',
  },
  areaTextActive: {
    color: colors.white,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
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
