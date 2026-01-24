import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useCategoryStore } from '@/stores/category'
import { useAuthStore } from '@/stores/auth'
import { CreateRecruitmentData } from '@/services/recruitment'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'
import { LocationPickerModal, LocationData } from '@/components/LocationPickerModal'

type AreaType = 'TOKYO' | 'SENDAI'

export default function CreateRecruitmentScreen() {
  const { user } = useAuthStore()
  const { addRecruitment } = useRecruitmentStore()
  const { categories, fetchCategories } = useCategoryStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [form, setForm] = useState<{
    categoryId: string
    title: string
    description: string
    datetimeFlex: string
    landmarkName: string
    latitude: number | null
    longitude: number | null
    minPeople: number
    maxPeople: number
    area: AreaType
  }>({
    categoryId: '',
    title: '',
    description: '',
    datetimeFlex: '',
    landmarkName: '',
    latitude: null,
    longitude: null,
    minPeople: 2,
    maxPeople: 4,
    area: 'TOKYO',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const updateForm = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = (): string | null => {
    if (!form.categoryId) {
      return 'カテゴリを選択してください'
    }
    if (!form.title.trim()) {
      return 'タイトルを入力してください'
    }
    if (form.title.length < 5) {
      return 'タイトルは5文字以上で入力してください'
    }
    if (form.minPeople > form.maxPeople) {
      return '最少人数は最大人数以下にしてください'
    }
    return null
  }

  const handleSubmit = async () => {
    const error = validateForm()
    if (error) {
      Alert.alert('入力エラー', error)
      return
    }

    setIsSubmitting(true)
    try {
      const data: CreateRecruitmentData = {
        categoryId: form.categoryId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        datetimeFlex: form.datetimeFlex.trim() || undefined,
        landmarkName: form.landmarkName.trim() || undefined,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
        minPeople: form.minPeople,
        maxPeople: form.maxPeople,
        area: form.area,
      }

      const recruitment = await addRecruitment(data)
      Alert.alert('作成完了', '募集を作成しました。おすすめユーザーにオファーを送りましょう！', [
        {
          text: 'あとで',
          style: 'cancel',
          onPress: () => router.replace(`/recruitment/${recruitment.id}`),
        },
        {
          text: 'オファーを送る',
          onPress: () => router.replace(`/recruitment/${recruitment.id}/suggestions`),
        },
      ])
    } catch (error: any) {
      Alert.alert('エラー', error.message || '募集の作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 位置選択時のハンドラー
  const handleLocationSelect = (location: LocationData) => {
    setForm((prev) => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      landmarkName: location.address || prev.landmarkName,
    }))
  }

  // 位置情報をクリア
  const handleClearLocation = () => {
    setForm((prev) => ({
      ...prev,
      latitude: null,
      longitude: null,
    }))
  }

  // 位置が選択されているかどうか
  const hasLocation = form.latitude !== null && form.longitude !== null

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '募集を作成',
          headerBackTitle: '戻る',
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <ScrollView style={styles.scrollView}>
            {/* カテゴリ選択 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>カテゴリ *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      form.categoryId === category.id && styles.categoryChipActive,
                    ]}
                    onPress={() => updateForm('categoryId', category.id)}
                  >
                    <CategoryIcon
                      name={category.icon}
                      size={16}
                      color={form.categoryId === category.id ? colors.white : colors.primary[600]}
                    />
                    <Text
                      style={[
                        styles.categoryName,
                        form.categoryId === category.id && styles.categoryNameActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* タイトル */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>タイトル *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(v) => updateForm('title', v)}
                placeholder="例：週末にカフェ巡りしませんか？"
                placeholderTextColor={colors.primary[400]}
                maxLength={50}
              />
              <Text style={styles.charCount}>{form.title.length}/50</Text>
            </View>

            {/* 説明 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>詳細説明</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(v) => updateForm('description', v)}
                placeholder="募集の詳細を記入してください"
                placeholderTextColor={colors.primary[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{form.description.length}/500</Text>
            </View>

            {/* エリア */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>エリア *</Text>
              <View style={styles.areaRow}>
                {(['TOKYO', 'SENDAI'] as AreaType[]).map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.areaChip,
                      form.area === area && styles.areaChipActive,
                    ]}
                    onPress={() => updateForm('area', area)}
                  >
                    <Text
                      style={[
                        styles.areaText,
                        form.area === area && styles.areaTextActive,
                      ]}
                    >
                      {area === 'TOKYO' ? '東京' : '仙台'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 日程 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>日程（柔軟指定）</Text>
              <TextInput
                style={styles.input}
                value={form.datetimeFlex}
                onChangeText={(v) => updateForm('datetimeFlex', v)}
                placeholder="例：週末の午後、平日夜など"
                placeholderTextColor={colors.primary[400]}
                maxLength={50}
              />
            </View>

            {/* 場所 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>場所</Text>

              {/* マップで選択ボタン */}
              <TouchableOpacity
                style={[styles.mapSelectButton, hasLocation && styles.mapSelectButtonActive]}
                onPress={() => setShowLocationPicker(true)}
              >
                <MaterialCommunityIcons
                  name={hasLocation ? 'map-marker-check' : 'map-marker-plus'}
                  size={20}
                  color={hasLocation ? colors.accent[600] : colors.primary[500]}
                />
                <Text style={[styles.mapSelectButtonText, hasLocation && styles.mapSelectButtonTextActive]}>
                  {hasLocation ? 'マップで場所を変更' : 'マップで場所を選択'}
                </Text>
                {hasLocation && (
                  <TouchableOpacity
                    style={styles.clearLocationButton}
                    onPress={handleClearLocation}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.primary[400]} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* 場所名入力 */}
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={form.landmarkName}
                onChangeText={(v) => updateForm('landmarkName', v)}
                placeholder="場所名（例：渋谷駅周辺）"
                placeholderTextColor={colors.primary[400]}
                maxLength={50}
              />

              {hasLocation && (
                <Text style={styles.coordinateHint}>
                  位置情報が設定されています
                </Text>
              )}
            </View>

            {/* 人数設定 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>募集人数 *</Text>
              <View style={styles.peopleRow}>
                <View style={styles.peopleInput}>
                  <Text style={styles.peopleLabel}>最少</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() =>
                        updateForm('minPeople', Math.max(2, form.minPeople - 1))
                      }
                    >
                      <Text style={styles.stepperButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{form.minPeople}</Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() =>
                        updateForm(
                          'minPeople',
                          Math.min(form.maxPeople, form.minPeople + 1)
                        )
                      }
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.peopleSeparator}>〜</Text>

                <View style={styles.peopleInput}>
                  <Text style={styles.peopleLabel}>最大</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() =>
                        updateForm(
                          'maxPeople',
                          Math.max(form.minPeople, form.maxPeople - 1)
                        )
                      }
                    >
                      <Text style={styles.stepperButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{form.maxPeople}</Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() =>
                        updateForm('maxPeople', Math.min(10, form.maxPeople + 1))
                      }
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>

          {/* 送信ボタン */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>募集を作成</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* 位置選択モーダル */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationSelect}
        initialLocation={hasLocation ? { latitude: form.latitude!, longitude: form.longitude! } : null}
        area={form.area}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: spacing.sm,
  },
  categoryList: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.primary[100],
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    color: colors.primary[600],
  },
  categoryNameActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 15,
    color: colors.primary[900],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: colors.primary[400],
    textAlign: 'right',
    marginTop: 4,
  },
  areaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  areaChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
  },
  areaChipActive: {
    backgroundColor: colors.primary[500],
  },
  areaText: {
    fontSize: 15,
    color: colors.primary[600],
    fontWeight: '500',
  },
  areaTextActive: {
    color: colors.white,
  },
  mapSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mapSelectButtonActive: {
    backgroundColor: colors.accent[50],
    borderColor: colors.accent[500],
  },
  mapSelectButtonText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  mapSelectButtonTextActive: {
    color: colors.accent[700],
  },
  clearLocationButton: {
    marginLeft: spacing.sm,
  },
  locationInput: {
    marginTop: 0,
  },
  coordinateHint: {
    fontSize: 12,
    color: colors.accent[600],
    marginTop: spacing.xs,
  },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleInput: {
    alignItems: 'center',
  },
  peopleLabel: {
    fontSize: 12,
    color: colors.primary[500],
    marginBottom: spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    fontSize: 20,
    color: colors.primary[500],
    fontWeight: '600',
  },
  stepperValue: {
    width: 40,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary[900],
  },
  peopleSeparator: {
    fontSize: 20,
    color: colors.primary[400],
    marginHorizontal: spacing.lg,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.primary[200],
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
