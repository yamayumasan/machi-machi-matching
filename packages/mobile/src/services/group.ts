import { api } from './api'

export interface Group {
  id: string
  recruitmentId: string
  createdAt: string
  recruitment: {
    id: string
    title: string
    datetime: string | null
    datetimeFlex: string | null
    category: {
      id: string
      name: string
      icon: string
    }
  }
  members: GroupMember[]
  _count?: {
    messages: number
  }
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    nickname: string
    avatar: string | null
  }
}

export interface Message {
  id: string
  groupId: string
  senderId: string
  content: string
  createdAt: string
  sender: {
    id: string
    nickname: string
    avatar: string | null
  }
}

// グループ一覧取得
export const getGroups = async (): Promise<Group[]> => {
  const response = await api.get<Group[]>('/groups')
  return response.data
}

// グループ詳細取得
export const getGroup = async (id: string): Promise<Group> => {
  const response = await api.get<Group>(`/groups/${id}`)
  return response.data
}

// メッセージ一覧取得
export const getMessages = async (groupId: string): Promise<Message[]> => {
  const response = await api.get<Message[]>(`/groups/${groupId}/messages`)
  return response.data
}

// メッセージ送信
export const sendMessage = async (groupId: string, content: string): Promise<Message> => {
  const response = await api.post<Message>(`/groups/${groupId}/messages`, { content })
  return response.data
}
