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
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)
  const { signIn, signInWithGoogle, signInWithApple, isOnboarded } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
      // ログイン成功後、適切な画面へ遷移
      const { isOnboarded: onboarded } = useAuthStore.getState()
      if (onboarded) {
        router.replace('/(tabs)')
      } else {
        router.replace('/onboarding')
      }
    } catch (error: any) {
      Alert.alert('ログインエラー', error.message || 'ログインに失敗しました')
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

  const handleAppleLogin = async () => {
    setIsAppleLoading(true)
    try {
      await signInWithApple()
      // ログイン成功後、適切な画面へ遷移
      const { isOnboarded: onboarded } = useAuthStore.getState()
      if (onboarded) {
        router.replace('/(tabs)')
      } else {
        router.replace('/onboarding')
      }
    } catch (error: any) {
      if (error.message !== 'ログインがキャンセルされました') {
        Alert.alert('Appleログインエラー', error.message || 'ログインに失敗しました')
      }
    } finally {
      setIsAppleLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>マチマチ</Text>
          <Text style={styles.titleAccent}>マッチング</Text>
          <Text style={styles.subtitle}>街で、待ちで、マッチング。</Text>
        </View>

        <View style={styles.form}>
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
            placeholder="パスワード"
            placeholderTextColor={colors.primary[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || isGoogleLoading || isAppleLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>ログイン</Text>
            )}
          </TouchableOpacity>

          {/* 区切り線 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Googleログインボタン */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading || isAppleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.primary[700]} />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Googleでログイン</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Appleログインボタン（iOSのみ） */}
          {Platform.OS === 'ios' && (
            <View style={styles.appleButtonContainer}>
              {isAppleLoading ? (
                <View style={styles.appleButtonLoading}>
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={styles.appleButton}
                  onPress={handleAppleLogin}
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>アカウントをお持ちでない方</Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>新規登録</Text>
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
    backgroundColor: colors.background,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[900],
  },
  titleAccent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[500],
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
    borderColor: colors.primary[200],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.primary[900],
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
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
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primary[200],
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
    borderColor: colors.primary[200],
    borderRadius: 12,
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
  appleButtonContainer: {
    marginTop: spacing.sm,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  appleButtonLoading: {
    width: '100%',
    height: 50,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
})
