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

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuthStore()

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
      await signUp(email, password)
      Alert.alert('登録完了', '確認メールを送信しました。メールを確認してください。')
    } catch (error: any) {
      Alert.alert('登録エラー', error.message || '登録に失敗しました')
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
          <Text style={styles.title}>新規登録</Text>
          <Text style={styles.subtitle}>
            マチマチマッチングを始めましょう
          </Text>
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
            placeholder="パスワード（6文字以上）"
            placeholderTextColor={colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード（確認）"
            placeholderTextColor={colors.gray[400]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '登録中...' : '登録する'}
            </Text>
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
    color: colors.gray[900],
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
