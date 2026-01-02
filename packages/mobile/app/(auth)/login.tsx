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
} from 'react-native'
import { Link, router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert('ログインエラー', error.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
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
            placeholderTextColor={colors.gray[400]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード"
            placeholderTextColor={colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Text>
          </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  titleAccent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.gray[900],
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
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.gray[500],
    fontSize: 14,
  },
  linkText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
})
