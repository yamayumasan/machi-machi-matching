import { useState } from 'react'
import {
  View,
  Text,
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
import { Button, Input } from '@/components'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)
  const { signIn, signInWithGoogle, signInWithApple } = useAuthStore()

  const isAnyLoading = isLoading || isGoogleLoading || isAppleLoading

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
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
          <Input
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Input
            placeholder="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <Button
            onPress={handleLogin}
            loading={isLoading}
            disabled={isAnyLoading}
            fullWidth
            style={styles.loginButton}
          >
            ログイン
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            variant="secondary"
            onPress={handleGoogleLogin}
            loading={isGoogleLoading}
            disabled={isAnyLoading}
            fullWidth
          >
            <View style={styles.googleContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Googleでログイン</Text>
            </View>
          </Button>

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
                  cornerRadius={12}
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
    fontWeight: fontWeight.bold,
    color: colors.primary[900],
  },
  titleAccent: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.primary[500],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  loginButton: {
    marginTop: spacing.sm,
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
    fontSize: fontSize.sm,
    marginHorizontal: spacing.md,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: '#4285F4',
    marginRight: spacing.sm,
  },
  googleButtonText: {
    color: colors.primary[700],
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.primary[500],
    fontSize: fontSize.sm,
  },
  linkText: {
    color: colors.primary[600],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
})
