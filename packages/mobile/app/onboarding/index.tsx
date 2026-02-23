import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, animation } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

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
  { id: 'TOKYO', name: '東京', icon: '🗼', description: '東京都内でマッチング' },
  { id: 'SENDAI', name: '仙台', icon: '🏯', description: '宮城県・仙台周辺でマッチング' },
]

const WELCOME_SLIDES = [
  {
    icon: 'people',
    title: 'マチマチへようこそ',
    subtitle: '新しい出会いを見つけよう',
    description: '同じ趣味を持つ仲間と繋がって\n一緒にアクティビティを楽しもう',
  },
  {
    icon: 'search',
    title: '募集をかける',
    subtitle: 'まちの人を集めよう',
    description: 'ボドゲ、カフェ、飲み会など\n今すぐ仲間を見つけられます',
  },
  {
    icon: 'hand-right',
    title: 'やりたいことを表明',
    subtitle: 'あなたを見つけてもらおう',
    description: 'やりたいことを登録しておくと\n誘いが来るかもしれません',
  },
]

const TOTAL_STEPS = WELCOME_SLIDES.length + 3 // welcome slides + profile + categories + area

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState<'TOKYO' | 'SENDAI' | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { completeOnboarding } = useAuthStore()

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      duration: animation.duration.default,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [currentStep])

  const animateTransition = useCallback((direction: 'next' | 'back', callback: () => void) => {
    const translateX = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animation.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: translateX * 0.3,
        duration: animation.duration.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback()
      slideAnim.setValue(-translateX * 0.3)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animation.duration.default,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animation.duration.default,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    })
  }, [fadeAnim, slideAnim])

  const toggleCategory = (id: string) => {
    // Scale animation on tap
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    const profileStep = WELCOME_SLIDES.length
    const categoryStep = WELCOME_SLIDES.length + 1

    if (currentStep < WELCOME_SLIDES.length) {
      // Welcome slides
      animateTransition('next', () => setCurrentStep(currentStep + 1))
    } else if (currentStep === profileStep) {
      // Profile step
      if (!nickname.trim()) {
        Alert.alert('エラー', 'ニックネームを入力してください')
        return
      }
      animateTransition('next', () => setCurrentStep(currentStep + 1))
    } else if (currentStep === categoryStep) {
      // Category step
      if (selectedCategories.length === 0) {
        Alert.alert('エラー', '興味のあるカテゴリを1つ以上選択してください')
        return
      }
      animateTransition('next', () => setCurrentStep(currentStep + 1))
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition('back', () => setCurrentStep(currentStep - 1))
    }
  }

  const handleComplete = async () => {
    if (!selectedArea) {
      Alert.alert('エラー', 'エリアを選択してください')
      return
    }

    if (!agreedToTerms) {
      Alert.alert('エラー', '利用規約とプライバシーポリシーに同意してください')
      return
    }

    setIsLoading(true)
    try {
      await completeOnboarding({
        nickname: nickname.trim(),
        bio: bio.trim() || undefined,
        area: selectedArea,
        categoryIds: selectedCategories,
        agreedToTerms: true,
      })
      router.replace('/(tabs)')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '設定の保存に失敗しました'
      Alert.alert('エラー', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const isWelcomeStep = currentStep < WELCOME_SLIDES.length
  const profileStep = WELCOME_SLIDES.length
  const categoryStep = WELCOME_SLIDES.length + 1
  const areaStep = WELCOME_SLIDES.length + 2

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} / {TOTAL_STEPS}
          </Text>
        </View>
        {/* Step Dots */}
        <View style={styles.stepDots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive,
                index < currentStep && styles.stepDotCompleted,
              ]}
            >
              {index < currentStep && (
                <Ionicons name="checkmark" size={10} color={colors.white} />
              )}
            </View>
          ))}
        </View>
      </View>

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Welcome Slides */}
        {isWelcomeStep && (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconContainer}>
              <View style={styles.welcomeIconCircle}>
                <Ionicons
                  name={WELCOME_SLIDES[currentStep].icon as keyof typeof Ionicons.glyphMap}
                  size={64}
                  color={colors.primary[600]}
                />
              </View>
            </View>
            <Text style={styles.welcomeTitle}>{WELCOME_SLIDES[currentStep].title}</Text>
            <Text style={styles.welcomeSubtitle}>{WELCOME_SLIDES[currentStep].subtitle}</Text>
            <Text style={styles.welcomeDescription}>{WELCOME_SLIDES[currentStep].description}</Text>

            <View style={styles.welcomeButtonContainer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonTextSecondary}>戻る</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, currentStep === 0 && styles.buttonFull]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>
                  {currentStep === WELCOME_SLIDES.length - 1 ? 'はじめる' : '次へ'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile Step */}
        {currentStep === profileStep && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="person" size={28} color={colors.primary[600]} />
              </View>
              <Text style={styles.title}>プロフィール設定</Text>
              <Text style={styles.subtitle}>まずはあなたのことを教えてください</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  ニックネーム <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="例: やまだ"
                  placeholderTextColor={colors.neutral[400]}
                  value={nickname}
                  onChangeText={setNickname}
                  maxLength={20}
                />
                <Text style={styles.charCount}>{nickname.length}/20</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>自己紹介（任意）</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="例: ボドゲとカフェ巡りが好きです"
                  placeholderTextColor={colors.neutral[400]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={styles.charCount}>{bio.length}/200</Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextSecondary}>戻る</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>次へ</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Category Step */}
        {currentStep === categoryStep && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="heart" size={28} color={colors.primary[600]} />
              </View>
              <Text style={styles.title}>興味のあるカテゴリ</Text>
              <Text style={styles.subtitle}>
                興味のあるものを選んでください（複数選択可）
              </Text>
            </View>

            <View style={styles.selectedCount}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary[600]} />
              <Text style={styles.selectedCountText}>
                {selectedCategories.length}個 選択中
              </Text>
            </View>

            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected,
                    ]}
                    onPress={() => toggleCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIconWrapper,
                      isSelected && styles.categoryIconWrapperSelected,
                    ]}>
                      <CategoryIcon
                        name={category.icon}
                        size={24}
                        color={isSelected ? colors.white : colors.primary[600]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.categoryCheck}>
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextSecondary}>戻る</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>次へ</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Area Step */}
        {currentStep === areaStep && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIconContainer}>
                <Ionicons name="location" size={28} color={colors.primary[600]} />
              </View>
              <Text style={styles.title}>活動エリア</Text>
              <Text style={styles.subtitle}>主に活動するエリアを選んでください</Text>
            </View>

            <View style={styles.areaList}>
              {AREAS.map((area) => {
                const isSelected = selectedArea === area.id
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[
                      styles.areaItem,
                      isSelected && styles.areaItemSelected,
                    ]}
                    onPress={() => setSelectedArea(area.id as 'TOKYO' | 'SENDAI')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.areaIconWrapper}>
                      <Text style={styles.areaIcon}>{area.icon}</Text>
                    </View>
                    <View style={styles.areaTextWrapper}>
                      <Text style={[styles.areaName, isSelected && styles.areaNameSelected]}>
                        {area.name}
                      </Text>
                      <Text style={styles.areaDescription}>{area.description}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.areaCheck}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Terms Section */}
            <View style={styles.termsSection}>
              <TouchableOpacity
                style={styles.termsCheckbox}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>
                <View style={styles.termsTextWrapper}>
                  <Text style={styles.termsText}>
                    <Text
                      style={styles.termsLink}
                      onPress={() => router.push('/terms')}
                    >
                      利用規約
                    </Text>
                    <Text>と</Text>
                    <Text
                      style={styles.termsLink}
                      onPress={() => router.push('/privacy')}
                    >
                      プライバシーポリシー
                    </Text>
                    <Text>に同意する</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextSecondary}>戻る</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  styles.buttonComplete,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleComplete}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>保存中...</Text>
                ) : (
                  <>
                    <Text style={styles.buttonText}>はじめる</Text>
                    <Ionicons name="rocket" size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary[600],
    minWidth: 40,
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary[600],
    transform: [{ scale: 1.2 }],
  },
  stepDotCompleted: {
    backgroundColor: colors.primary[500],
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  // Welcome Slides
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  welcomeIconContainer: {
    marginBottom: spacing.xl,
  },
  welcomeIconCircle: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  welcomeTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  welcomeDescription: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  welcomeButtonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  // Step Header
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  // Form
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.accent[500],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.md,
    color: colors.neutral[800],
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.neutral[400],
    textAlign: 'right',
  },
  // Buttons
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: colors.primary[600],
    ...shadows.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  buttonFull: {
    flex: 1,
  },
  buttonComplete: {
    flex: 1.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  buttonTextSecondary: {
    color: colors.neutral[700],
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  // Categories
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  selectedCountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary[700],
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '31%',
    aspectRatio: 0.9,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    paddingVertical: spacing.sm,
  },
  categoryItemSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  categoryIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.xs,
  },
  categoryIconWrapperSelected: {
    backgroundColor: colors.primary[600],
  },
  categoryName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  categoryCheck: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Areas
  areaList: {
    gap: spacing.md,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.xs,
  },
  areaItemSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  areaIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  areaIcon: {
    fontSize: 32,
  },
  areaTextWrapper: {
    flex: 1,
  },
  areaName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: 2,
  },
  areaNameSelected: {
    color: colors.primary[700],
  },
  areaDescription: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  areaCheck: {
    marginLeft: spacing.sm,
  },
  // Terms
  termsSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  termsTextWrapper: {
    flex: 1,
  },
  termsText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    color: colors.neutral[600],
  },
  termsLink: {
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    textDecorationLine: 'underline',
  },
})
