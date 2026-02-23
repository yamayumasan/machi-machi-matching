import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ModalProps as RNModalProps,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/constants/theme'

export interface ModalProps extends Omit<RNModalProps, 'transparent' | 'animationType'> {
  title?: string
  children: React.ReactNode
  onClose: () => void
  showCloseButton?: boolean
  fullScreen?: boolean
  contentStyle?: ViewStyle
  scrollable?: boolean
}

export function Modal({
  title,
  children,
  onClose,
  showCloseButton = true,
  fullScreen = false,
  contentStyle,
  scrollable = false,
  ...props
}: ModalProps) {
  const insets = useSafeAreaInsets()

  const content = (
    <View
      style={[
        styles.content,
        fullScreen && styles.contentFullScreen,
        fullScreen && { paddingBottom: insets.bottom + spacing.md },
        contentStyle,
      ]}
    >
      {(title || showCloseButton) && (
        <View style={styles.header}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <View />
          )}
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      {scrollable ? (
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  )

  return (
    <RNModal
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {content}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // ガイドライン準拠: neutral-900 @ 60%
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white, // ガイドライン準拠
    borderRadius: borderRadius['2xl'], // ガイドライン準拠: 20px
    ...shadows.xl, // ガイドライン準拠: モーダル用シャドウ
  },
  contentFullScreen: {
    maxWidth: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[900],
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },
  scrollContent: {
    maxHeight: 400,
  },
})
