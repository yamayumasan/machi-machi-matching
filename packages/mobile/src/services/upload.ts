import * as ImagePicker from 'expo-image-picker'
import { api } from './api'

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface UploadResult {
  url: string
}

// 画像選択オプション
interface ImagePickerOptions {
  allowsEditing?: boolean
  aspect?: [number, number]
  quality?: number
}

// カメラまたはライブラリから画像を選択
export async function pickImage(
  source: 'camera' | 'library',
  options: ImagePickerOptions = {}
): Promise<ImagePicker.ImagePickerAsset | null> {
  const {
    allowsEditing = true,
    aspect = [1, 1],
    quality = 0.8,
  } = options

  // 権限を確認
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('カメラへのアクセスが許可されていません')
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('写真ライブラリへのアクセスが許可されていません')
    }
  }

  // 画像を選択
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
      })

  if (result.canceled || !result.assets[0]) {
    return null
  }

  return result.assets[0]
}

// 画像をサーバーにアップロード
export async function uploadImage(
  uri: string,
  type: 'avatar' | 'general' = 'general'
): Promise<string> {
  // ファイル名を生成
  const filename = uri.split('/').pop() || `image_${Date.now()}.jpg`
  const match = /\.(\w+)$/.exec(filename)
  const mimeType = match ? `image/${match[1]}` : 'image/jpeg'

  // FormDataを作成
  const formData = new FormData()
  formData.append('file', {
    uri,
    name: filename,
    type: mimeType,
  } as any)
  formData.append('type', type)

  // アップロード
  const response = await api.post<ApiResponse<UploadResult>>(
    '/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data.data.url
}

// プロフィール画像をアップロード
export async function uploadAvatar(uri: string): Promise<string> {
  return uploadImage(uri, 'avatar')
}
