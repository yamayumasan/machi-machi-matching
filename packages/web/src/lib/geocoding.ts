/**
 * 逆ジオコーディング（座標→地名）
 * OpenStreetMap Nominatim APIを使用（無料）
 */

interface NominatimResponse {
  display_name: string
  address: {
    road?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
    postcode?: string
  }
}

/**
 * 座標から地名を取得
 * @param latitude 緯度
 * @param longitude 経度
 * @returns 地名（取得できない場合は null）
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=ja`,
      {
        headers: {
          'User-Agent': 'MachiMachiMatching/1.0',
        },
      }
    )

    if (!response.ok) {
      console.error('Geocoding API error:', response.status)
      return null
    }

    const data: NominatimResponse = await response.json()

    // 日本語の住所を組み立て
    const addr = data.address
    const parts: string[] = []

    // 市区町村
    if (addr.city) parts.push(addr.city)
    else if (addr.town) parts.push(addr.town)
    else if (addr.village) parts.push(addr.village)

    // 地区・町名
    if (addr.suburb) parts.push(addr.suburb)
    else if (addr.neighbourhood) parts.push(addr.neighbourhood)

    // 通り名（あれば）
    if (addr.road) parts.push(addr.road)

    if (parts.length > 0) {
      return parts.join(' ')
    }

    // フォールバック: display_nameから抽出
    if (data.display_name) {
      // display_nameは逆順（詳細→大まかな住所）なので、先頭部分を取得
      const nameParts = data.display_name.split(', ')
      return nameParts.slice(0, 3).join(' ')
    }

    return null
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    return null
  }
}

/**
 * 座標から簡略化した地名を取得（〇〇付近）
 */
export async function getLocationLabel(
  latitude: number,
  longitude: number
): Promise<string> {
  const name = await reverseGeocode(latitude, longitude)
  if (name) {
    return `${name}付近`
  }
  return '選択した場所'
}
