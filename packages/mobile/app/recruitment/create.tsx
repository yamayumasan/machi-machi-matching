import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { colors, spacing } from '@/constants/theme'

export default function CreateRecruitmentScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '募集を作成',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.placeholder}>募集作成画面</Text>
          <Text style={styles.subText}>実装予定</Text>
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
