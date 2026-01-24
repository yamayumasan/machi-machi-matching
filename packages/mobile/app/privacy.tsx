import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'

export default function PrivacyPolicyScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'プライバシーポリシー',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>プライバシーポリシー</Text>
        <Text style={styles.lastUpdated}>最終更新日: 2024年1月23日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 収集する情報</Text>
          <Text style={styles.paragraph}>
            本サービスでは、以下の情報を収集します：
          </Text>
          <Text style={styles.listItem}>• メールアドレス</Text>
          <Text style={styles.listItem}>• ニックネーム</Text>
          <Text style={styles.listItem}>• プロフィール情報（自己紹介、地域）</Text>
          <Text style={styles.listItem}>• 位置情報（任意）</Text>
          <Text style={styles.listItem}>• アプリ利用状況</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 情報の利用目的</Text>
          <Text style={styles.paragraph}>
            収集した情報は、以下の目的で利用します：
          </Text>
          <Text style={styles.listItem}>• サービスの提供・運営</Text>
          <Text style={styles.listItem}>• ユーザー認証</Text>
          <Text style={styles.listItem}>• マッチング機能の提供</Text>
          <Text style={styles.listItem}>• お知らせの送信</Text>
          <Text style={styles.listItem}>• サービスの改善</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 情報の共有</Text>
          <Text style={styles.paragraph}>
            お客様の個人情報を、以下の場合を除き、第三者に提供することはありません：
          </Text>
          <Text style={styles.listItem}>• お客様の同意がある場合</Text>
          <Text style={styles.listItem}>• 法令に基づく場合</Text>
          <Text style={styles.listItem}>• サービス提供に必要な範囲で業務委託先に提供する場合</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 情報の保護</Text>
          <Text style={styles.paragraph}>
            お客様の個人情報を保護するため、適切なセキュリティ対策を講じています。データは暗号化され、アクセス制御を行っています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. ユーザーの権利</Text>
          <Text style={styles.paragraph}>
            お客様は、ご自身の個人情報について、以下の権利を有します：
          </Text>
          <Text style={styles.listItem}>• 情報の閲覧・訂正</Text>
          <Text style={styles.listItem}>• 情報の削除（アカウント削除）</Text>
          <Text style={styles.listItem}>• 情報の利用停止</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. お問い合わせ</Text>
          <Text style={styles.paragraph}>
            プライバシーに関するお問い合わせは、アプリ内の設定画面からお問い合わせください。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. ポリシーの変更</Text>
          <Text style={styles.paragraph}>
            本ポリシーは、必要に応じて変更することがあります。重要な変更がある場合は、アプリ内でお知らせします。
          </Text>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 24,
    color: '#444',
    marginLeft: 8,
    marginBottom: 4,
  },
})
