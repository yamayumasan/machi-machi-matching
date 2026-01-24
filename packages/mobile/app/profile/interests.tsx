import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth'
import { updateUserCategories } from '@/services/auth'
import { getCategories, Category } from '@/services/category'
import { CategoryIcon } from '@/components/CategoryIcon'
import { colors, spacing } from '@/constants/theme'

export default function InterestsEditScreen() {
  const { user, fetchUser } = useAuthStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // カテゴリを読み込み
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data)
        // 現在の興味をセット
        if (user?.interests) {
          setSelectedIds(user.interests.map((i) => i.id))
        }
      } catch (error) {
        Alert.alert('エラー', 'カテゴリの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }
    loadCategories()
  }, [user?.interests])

  // カテゴリの選択/解除
  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      if (prev.length >= 5) {
        Alert.alert('上限に達しました', '興味は最大5つまで選択できます')
        return prev
      }
      return [...prev, id]
    })
  }

  // 保存
  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('エラー', '少なくとも1つのカテゴリを選択してください')
      return
    }

    setIsSubmitting(true)
    try {
      await updateUserCategories(selectedIds)
      await fetchUser()
      Alert.alert('更新完了', '興味カテゴリを更新しました', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (error: any) {
      Alert.alert('エラー', error.message || '更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: '興味カテゴリを編集',
            headerBackTitle: '戻る',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '興味カテゴリを編集',
          headerBackTitle: '戻る',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView}>
          {/* 説明 */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>
              興味のあるカテゴリを選択してください（最大5つ）
            </Text>
            <Text style={styles.selectedCount}>
              選択中: {selectedIds.length}/5
            </Text>
          </View>

          {/* カテゴリ一覧 */}
          <View style={styles.categoriesSection}>
            {categories.map((category) => {
              const isSelected = selectedIds.includes(category.id)
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
                    styles.categoryIcon,
                    isSelected && styles.categoryIconSelected,
                  ]}>
                    <CategoryIcon
                      name={category.icon}
                      size={24}
                      color={isSelected ? colors.white : colors.primary[600]}
                    />
                  </View>
                  <Text style={[
                    styles.categoryName,
                    isSelected && styles.categoryNameSelected,
                  ]}>
                    {category.name}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={colors.accent[600]}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        {/* 保存ボタン */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>保存する</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  descriptionSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent[600],
  },
  categoriesSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: colors.accent[50],
    borderColor: colors.accent[600],
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryIconSelected: {
    backgroundColor: colors.accent[600],
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary[900],
  },
  categoryNameSelected: {
    color: colors.accent[700],
    fontWeight: '600',
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
