import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'

export default function TermsOfServiceScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '利用規約',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>利用規約</Text>
        <Text style={styles.lastUpdated}>最終更新日: 2024年1月23日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第1条（適用）</Text>
          <Text style={styles.paragraph}>
            本規約は、本サービス（マッチマッチング）の利用に関する条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第2条（利用登録）</Text>
          <Text style={styles.paragraph}>
            利用登録は、本規約に同意の上、所定の方法により申請し、当社が承認することで完了します。以下の場合、登録を承認しないことがあります：
          </Text>
          <Text style={styles.listItem}>• 虚偽の情報を申告した場合</Text>
          <Text style={styles.listItem}>• 過去に本規約に違反したことがある場合</Text>
          <Text style={styles.listItem}>• その他、当社が不適切と判断した場合</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第3条（禁止事項）</Text>
          <Text style={styles.paragraph}>
            ユーザーは、以下の行為をしてはなりません：
          </Text>
          <Text style={styles.listItem}>• 法令または公序良俗に違反する行為</Text>
          <Text style={styles.listItem}>• 他のユーザーへの迷惑行為・嫌がらせ</Text>
          <Text style={styles.listItem}>• 虚偽の情報の登録・投稿</Text>
          <Text style={styles.listItem}>• 商業目的での利用（当社が認めた場合を除く）</Text>
          <Text style={styles.listItem}>• 他のユーザーの個人情報の収集・公開</Text>
          <Text style={styles.listItem}>• 不正アクセス行為</Text>
          <Text style={styles.listItem}>• 本サービスの運営を妨害する行為</Text>
          <Text style={styles.listItem}>• その他、当社が不適切と判断する行為</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第4条（サービスの提供）</Text>
          <Text style={styles.paragraph}>
            当社は、本サービスの内容を、予告なく変更・追加・停止することがあります。これによりユーザーに生じた損害について、当社は責任を負いません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第5条（知的財産権）</Text>
          <Text style={styles.paragraph}>
            本サービスに関する知的財産権は、当社または正当な権利者に帰属します。ユーザーは、本サービスを通じて提供される情報を、当社の許可なく複製・転載することはできません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第6条（免責事項）</Text>
          <Text style={styles.paragraph}>
            当社は、本サービスを通じたユーザー間のトラブルについて、一切の責任を負いません。また、本サービスの利用により生じた損害について、当社に故意または重過失がある場合を除き、責任を負いません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第7条（利用停止・退会）</Text>
          <Text style={styles.paragraph}>
            当社は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除することがあります。ユーザーは、いつでも退会することができます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第8条（規約の変更）</Text>
          <Text style={styles.paragraph}>
            当社は、本規約を変更することがあります。重要な変更がある場合は、アプリ内でお知らせします。変更後も本サービスを利用した場合、変更後の規約に同意したものとみなします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第9条（準拠法・管轄）</Text>
          <Text style={styles.paragraph}>
            本規約は日本法に準拠します。本サービスに関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
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
