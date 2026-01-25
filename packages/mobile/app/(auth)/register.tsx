import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const { signUp, signInWithGoogle } = useAuthStore()

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('エラー', '全ての項目を入力してください')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください')
      return
    }

    setIsLoading(true)
    try {
      const result = await signUp(email, password)
      if (result.needsEmailConfirmation) {
        setShowEmailConfirmation(true)
      }
    } catch (error: any) {
      Alert.alert('登録エラー', error.message || '登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
      // ログイン成功後、適切な画面へ遷移
      const { isOnboarded: onboarded } = useAuthStore.getState()
      if (onboarded) {
        router.replace('/(tabs)')
      } else {
        router.replace('/onboarding')
      }
    } catch (error: any) {
      if (error.message !== 'ログインがキャンセルされました') {
        Alert.alert('Googleログインエラー', error.message || 'ログインに失敗しました')
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // メール確認待ち画面
  if (showEmailConfirmation) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationIcon}>✉️</Text>
            <Text style={styles.confirmationTitle}>確認メールを送信しました</Text>
            <Text style={styles.confirmationText}>
              {email} に確認メールを送信しました。{'\n'}
              メール内のリンクをクリックして{'\n'}
              登録を完了してください。
            </Text>
            <TouchableOpacity
              style={styles.confirmationButton}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.buttonText}>ログイン画面へ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => setShowEmailConfirmation(false)}
            >
              <Text style={styles.resendButtonText}>別のメールアドレスで登録</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>新規登録</Text>
          <Text style={styles.subtitle}>
            マチマチマッチングを始めましょう
          </Text>
        </View>

        <View style={styles.form}>
          {/* Googleログインボタン */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.primary[700]} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Googleで登録</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 区切り線 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            placeholderTextColor={colors.primary[400]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード（6文字以上）"
            placeholderTextColor={colors.primary[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード（確認）"
            placeholderTextColor={colors.primary[400]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>登録する</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>すでにアカウントをお持ちの方</Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>ログイン</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[900],
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary[500],
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.primary[900],
  },
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primary[300],
  },
  dividerText: {
    color: colors.primary[500],
    fontSize: 14,
    marginHorizontal: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 8,
    paddingVertical: spacing.md,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: spacing.sm,
  },
  googleButtonText: {
    color: colors.primary[700],
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.primary[500],
    fontSize: 14,
  },
  linkText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  confirmationContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  confirmationIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[900],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: colors.primary[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  confirmationButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resendButton: {
    paddingVertical: spacing.sm,
  },
  resendButtonText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
})
