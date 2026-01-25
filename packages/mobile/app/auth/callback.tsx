import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/stores/auth'
import { colors } from '@/constants/theme'

export default function AuthCallbackScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      console.log('[AUTH CALLBACK] params:', params)

      // URLからトークン情報を取得
      // Supabaseは #access_token=...&refresh_token=... 形式でフラグメントに含める場合と
      // ?token=...&type=... 形式でクエリパラメータに含める場合がある
      const accessToken = params.access_token as string | undefined
      const refreshToken = params.refresh_token as string | undefined
      const type = params.type as string | undefined
      const tokenHash = params.token_hash as string | undefined

      // メール確認の場合（type=signup, type=email）
      if (type === 'signup' || type === 'email' || type === 'recovery') {
        console.log('[AUTH CALLBACK] Email verification type:', type)

        // token_hashがある場合はverifyOtpを使用
        if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type === 'recovery' ? 'recovery' : 'email',
          })

          if (verifyError) {
            console.error('[AUTH CALLBACK] Verify OTP error:', verifyError)
            setError('メール認証に失敗しました。リンクが期限切れの可能性があります。')
            return
          }
        }

        // 認証成功 - ログイン画面へ遷移
        console.log('[AUTH CALLBACK] Email verified successfully')
        router.replace('/login')
        return
      }

      // OAuth コールバックの場合（access_token と refresh_token がある）
      if (accessToken && refreshToken) {
        console.log('[AUTH CALLBACK] OAuth callback with tokens')

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          console.error('[AUTH CALLBACK] Set session error:', sessionError)
          setError('ログインに失敗しました。')
          return
        }

        // セッション設定成功 - メイン画面へ
        console.log('[AUTH CALLBACK] Session set successfully')
        router.replace('/(tabs)')
        return
      }

      // 不明なコールバック
      console.log('[AUTH CALLBACK] Unknown callback type, redirecting to login')
      router.replace('/login')
    } catch (err) {
      console.error('[AUTH CALLBACK] Error:', err)
      setError('認証処理中にエラーが発生しました。')
    }
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Text
          style={styles.linkText}
          onPress={() => router.replace('/login')}
        >
          ログイン画面へ戻る
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
      <Text style={styles.text}>認証を処理しています...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary[600],
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
})
