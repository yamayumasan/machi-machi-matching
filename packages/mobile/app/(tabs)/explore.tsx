import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '@/constants/theme'

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>募集を探す</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>
          地図機能は準備中です
        </Text>
        <Text style={styles.subText}>
          react-native-maps で実装予定
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 18,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  subText: {
    fontSize: 14,
    color: colors.gray[400],
  },
})
