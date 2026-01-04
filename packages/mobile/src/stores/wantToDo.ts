import { create } from 'zustand'
import {
  WantToDo,
  CreateWantToDoData,
  getWantToDos,
  createWantToDo,
  deleteWantToDo,
} from '@/services/wantToDo'

interface WantToDoState {
  wantToDos: WantToDo[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchWantToDos: () => Promise<void>
  addWantToDo: (data: CreateWantToDoData) => Promise<WantToDo>
  removeWantToDo: (id: string) => Promise<void>
  clearError: () => void
}

export const useWantToDoStore = create<WantToDoState>((set, get) => ({
  wantToDos: [],
  isLoading: false,
  error: null,

  fetchWantToDos: async () => {
    set({ isLoading: true, error: null })
    try {
      const wantToDos = await getWantToDos()
      set({ wantToDos, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'やりたいことの取得に失敗しました',
        isLoading: false,
      })
    }
  },

  addWantToDo: async (data: CreateWantToDoData) => {
    const wantToDo = await createWantToDo(data)
    set({ wantToDos: [wantToDo, ...get().wantToDos] })
    return wantToDo
  },

  removeWantToDo: async (id: string) => {
    await deleteWantToDo(id)
    set({ wantToDos: get().wantToDos.filter((w) => w.id !== id) })
  },

  clearError: () => set({ error: null }),
}))
