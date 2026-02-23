import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native'
import { colors, fontWeight, shadows } from '@/constants/theme'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  size?: AvatarSize
  name?: string | null
  imageUrl?: string | null
  style?: ViewStyle | ImageStyle
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 80,
}

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
}

export function Avatar({
  size = 'md',
  name,
  imageUrl,
  style,
}: AvatarProps) {
  const dimension = sizeMap[size]
  const textSize = fontSizeMap[size]

  const getInitial = () => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          { width: dimension, height: dimension, borderRadius: dimension / 2 },
          style as ImageStyle,
        ]}
      />
    )
  }

  return (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: textSize }]}>
        {getInitial()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // ガイドライン v2 準拠
    borderColor: colors.white,
    ...shadows.xs, // ガイドライン v2 準拠
  },
  image: {
    backgroundColor: colors.primary[100],
    borderWidth: 2, // ガイドライン v2 準拠
    borderColor: colors.white,
  },
  initial: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
})
