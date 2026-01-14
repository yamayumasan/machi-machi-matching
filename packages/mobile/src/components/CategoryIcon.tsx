import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '@/constants/theme'

// MDI名（seed.tsの形式）→ MaterialCommunityIconsの名前に変換
const MDI_NAME_MAP: Record<string, string> = {
  // カテゴリアイコン
  mdiDice6: 'dice-6',
  mdiCoffee: 'coffee',
  mdiGlassMugVariant: 'glass-mug-variant',
  mdiSoccer: 'soccer',
  mdiGamepadVariant: 'gamepad-variant',
  mdiMovie: 'movie',
  mdiBookOpenPageVariant: 'book-open-page-variant',
  mdiMusic: 'music',
  mdiRun: 'run',
  mdiWeightLifter: 'weight-lifter',
  mdiYoga: 'yoga',
  mdiCamera: 'camera',
  mdiPalette: 'palette',
  mdiLaptop: 'laptop',
  mdiForum: 'forum',
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

interface CategoryIconProps {
  name: string
  size?: number
  color?: string
}

/**
 * APIから取得したMDI名（例: mdiDice6）をMaterialCommunityIconsで表示するコンポーネント
 */
export function CategoryIcon({ name, size = 20, color = colors.primary[600] }: CategoryIconProps) {
  // MDI名をMaterialCommunityIconsの形式に変換
  const iconName = MDI_NAME_MAP[name] || 'help-circle'

  return (
    <MaterialCommunityIcons
      name={iconName as IconName}
      size={size}
      color={color}
    />
  )
}

/**
 * MDI名が有効かどうかを確認
 */
export function isValidMdiName(name: string): boolean {
  return name in MDI_NAME_MAP
}
