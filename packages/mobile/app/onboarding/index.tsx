import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'

const CATEGORIES = [
  { id: '1', name: 'ボドゲ', icon: 'mdiDice6' },
  { id: '2', name: 'カフェ', icon: 'mdiCoffee' },
  { id: '3', name: '飲み会', icon: 'mdiGlassMugVariant' },
  { id: '4', name: 'スポーツ', icon: 'mdiSoccer' },
  { id: '5', name: 'ゲーム', icon: 'mdiGamepadVariant' },
  { id: '6', name: '映画', icon: 'mdiMovie' },
  { id: '7', name: '読書', icon: 'mdiBookOpenPageVariant' },
  { id: '8', name: '音楽', icon: 'mdiMusic' },
  { id: '9', name: 'ランニング', icon: 'mdiRun' },
  { id: '10', name: 'ジム', icon: 'mdiWeightLifter' },
  { id: '11', name: 'ヨガ', icon: 'mdiYoga' },
  { id: '12', name: '写真', icon: 'mdiCamera' },
  { id: '13', name: 'アート', icon: 'mdiPalette' },
  { id: '14', name: 'プログラミング', icon: 'mdiLaptop' },
  { id: '15', name: '勉強会', icon: 'mdiForum' },
]

const AREAS = [
  { id: 'TOKYO', name: '東京', icon: '🗼' },
  { id: 'SENDAI', name: '仙台', icon: '🏯' },
]

export default function OnboardingScreen() {
  const [step, setStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState<'TOKYO' | 'SENDAI' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { completeOnboarding } = useAuthStore()

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    if (step === 1) {
      if (!nickname.trim()) {
        Alert.alert('エラー', 'ニックネームを入力してください')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (selectedCategories.length === 0) {
        Alert.alert('エラー', '興味のあるカテゴリを1つ以上選択してください')
        return
      }
      setStep(3)
    }
  }

  const handleComplete = async () => {
    if (!selectedArea) {
      Alert.alert('エラー', 'エリアを選択してください')
      return
    }

    setIsLoading(true)
    try {
      await completeOnboarding({
        nickname: nickname.trim(),
        bio: bio.trim() || undefined,
        area: selectedArea,
        categoryIds: selectedCategories,
      })
      router.replace('/(tabs)')
    } catch (error: any) {
      Alert.alert('エラー', error.message || '設定の保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 進捗インジケーター */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>Step {step}/3</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
      </View>

      {/* Step 1: プロフィール設定 */}
      {step === 1 && (
        <ScrollView style={styles.content}>
          <Text style={styles.title}>プロフィール設定</Text>
          <Text style={styles.subtitle}>
            まずはあなたのことを教えてください
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ニックネーム *</Text>
              <TextInput
                style={styles.input}
                placeholder="例: やまだ"
                placeholderTextColor={colors.primary[400]}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>自己紹介（任意）</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="例: ボドゲとカフェ巡りが好きです"
                placeholderTextColor={colors.primary[400]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>次へ</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step 2: 興味のあるカテゴリ */}
      {step === 2 && (
        <ScrollView style={styles.content}>
          <Text style={styles.title}>興味のあるカテゴリ</Text>
          <Text style={styles.subtitle}>
            興味のあるものを選んでください（複数選択可）
          </Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategories.includes(category.id) && styles.categoryItemSelected,
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <CategoryIcon
                  name={category.icon}
                  size={24}
                  color={selectedCategories.includes(category.id) ? colors.white : colors.primary[600]}
                />
                <Text
                  style={[
                    styles.categoryName,
                    selectedCategories.includes(category.id) && styles.categoryNameSelected,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setStep(1)}
            >
              <Text style={styles.buttonTextSecondary}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>次へ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Step 3: 活動エリア */}
      {step === 3 && (
        <ScrollView style={styles.content}>
          <Text style={styles.title}>活動エリア</Text>
          <Text style={styles.subtitle}>
            主に活動するエリアを選んでください
          </Text>

          <View style={styles.areaList}>
            {AREAS.map((area) => (
              <TouchableOpacity
                key={area.id}
                style={[
                  styles.areaItem,
                  selectedArea === area.id && styles.areaItemSelected,
                ]}
                onPress={() => setSelectedArea(area.id as 'TOKYO' | 'SENDAI')}
              >
                <Text style={styles.areaIcon}>{area.icon}</Text>
                <Text
                  style={[
                    styles.areaName,
                    selectedArea === area.id && styles.areaNameSelected,
                  ]}
                >
                  {area.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setStep(2)}
            >
              <Text style={styles.buttonTextSecondary}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? '保存中...' : 'はじめる'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  progress: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  progressText: {
    fontSize: 14,
    color: colors.primary[500],
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.primary[200],
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary[500],
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.primary[700],
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: 12,
    color: colors.primary[700],
  },
  categoryNameSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  areaList: {
    gap: spacing.md,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  areaItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  areaIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  areaName: {
    fontSize: 18,
    color: colors.primary[700],
  },
  areaNameSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },
})
