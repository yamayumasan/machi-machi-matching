import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../lib/api'

interface Category {
  id: string
  name: string
  icon: string
}

interface RecruitmentUser {
  id: string
  nickname: string | null
  avatarUrl: string | null
  area?: string | null
  bio?: string | null
}

interface RecruitmentMember {
  id: string
  nickname: string | null
  avatarUrl: string | null
  role: 'OWNER' | 'MEMBER'
}

interface Recruitment {
  id: string
  title: string
  description: string | null
  datetime: string | null
  datetimeFlex: string | null
  area: string
  location: string | null
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
  minPeople: number
  maxPeople: number
  currentPeople: number
  status: string
  createdAt: string
  category: Category
  creator?: RecruitmentUser
  members?: RecruitmentMember[]
  isOwner?: boolean
  hasApplied?: boolean
  applicationStatus?: string | null
  hasReceivedOffer?: boolean
  offerStatus?: string | null
}

interface Application {
  id: string
  status: string
  message: string | null
  createdAt: string
  respondedAt: string | null
  applicant?: RecruitmentUser
  recruitment?: {
    id: string
    title: string
    category: Category
    creator: RecruitmentUser
  }
}

interface Offer {
  id: string
  status: string
  message: string | null
  createdAt: string
  respondedAt: string | null
  recruitment?: {
    id: string
    title: string
    category: Category
    creator: RecruitmentUser
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const useRecruitmentStore = defineStore('recruitment', () => {
  // State
  const recruitments = ref<Recruitment[]>([])
  const myRecruitments = ref<Recruitment[]>([])
  const currentRecruitment = ref<Recruitment | null>(null)
  const applications = ref<Application[]>([])
  const myApplications = ref<Application[]>([])
  const myOffers = ref<Offer[]>([])
  const pagination = ref<Pagination | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const fetchRecruitments = async (params?: {
    page?: number
    limit?: number
    area?: string
    categoryId?: string
    status?: string
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', String(params.page))
      if (params?.limit) queryParams.set('limit', String(params.limit))
      if (params?.area) queryParams.set('area', params.area)
      if (params?.categoryId) queryParams.set('categoryId', params.categoryId)
      if (params?.status) queryParams.set('status', params.status)

      const endpoint = `/recruitments${queryParams.toString() ? `?${queryParams}` : ''}`
      const response = await api.get<{
        items: Recruitment[]
        pagination: Pagination
      }>(endpoint)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch recruitments'
        return false
      }

      recruitments.value = response.data.items
      pagination.value = response.data.pagination
      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchMyRecruitments = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<Recruitment[]>('/recruitments/me')

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch my recruitments'
        return false
      }

      myRecruitments.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchRecruitment = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<Recruitment>(`/recruitments/${id}`)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch recruitment'
        return false
      }

      currentRecruitment.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const createRecruitment = async (data: {
    title: string
    categoryId: string
    description?: string | null
    datetime?: string | null
    datetimeFlex?: string | null
    area: string
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    locationName?: string | null
    minPeople?: number
    maxPeople?: number
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<Recruitment>('/recruitments', data)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to create recruitment'
        return null
      }

      myRecruitments.value.unshift(response.data)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  const updateRecruitment = async (
    id: string,
    data: {
      title?: string
      description?: string | null
      datetime?: string | null
      datetimeFlex?: string | null
      location?: string | null
      minPeople?: number
      maxPeople?: number
    }
  ) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put<Recruitment>(`/recruitments/${id}`, data)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to update recruitment'
        return false
      }

      // Update in myRecruitments
      const index = myRecruitments.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        myRecruitments.value[index] = { ...myRecruitments.value[index], ...response.data }
      }

      // Update currentRecruitment if viewing
      if (currentRecruitment.value?.id === id) {
        currentRecruitment.value = { ...currentRecruitment.value, ...response.data }
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  const closeRecruitment = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put(`/recruitments/${id}/close`, {})

      if (!response.success) {
        error.value = response.error?.message || 'Failed to close recruitment'
        return false
      }

      // Update status locally
      const index = myRecruitments.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        myRecruitments.value[index].status = 'CLOSED'
      }

      if (currentRecruitment.value?.id === id) {
        currentRecruitment.value.status = 'CLOSED'
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  const cancelRecruitment = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.delete(`/recruitments/${id}`)

      if (!response.success) {
        error.value = response.error?.message || 'Failed to cancel recruitment'
        return false
      }

      // Update status locally
      const index = myRecruitments.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        myRecruitments.value[index].status = 'CANCELLED'
      }

      if (currentRecruitment.value?.id === id) {
        currentRecruitment.value.status = 'CANCELLED'
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  // Applications
  const applyToRecruitment = async (id: string, message?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<Application>(`/recruitments/${id}/apply`, { message })

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to apply'
        return null
      }

      // Update current recruitment state
      if (currentRecruitment.value?.id === id) {
        currentRecruitment.value.hasApplied = true
        currentRecruitment.value.applicationStatus = response.data.status
      }

      return response.data
    } finally {
      isLoading.value = false
    }
  }

  const fetchApplications = async (recruitmentId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<Application[]>(`/recruitments/${recruitmentId}/applications`)

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch applications'
        return false
      }

      applications.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const respondToApplication = async (
    recruitmentId: string,
    applicationId: string,
    action: 'APPROVE' | 'REJECT'
  ) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put(`/recruitments/${recruitmentId}/applications/${applicationId}`, { action })

      if (!response.success) {
        error.value = response.error?.message || 'Failed to respond to application'
        return false
      }

      // Update local state
      const index = applications.value.findIndex((a) => a.id === applicationId)
      if (index !== -1) {
        applications.value[index].status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  const fetchMyApplications = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<Application[]>('/recruitments/me/applications')

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch my applications'
        return false
      }

      myApplications.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  // Offers
  const sendOffer = async (recruitmentId: string, receiverId: string, message?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post<Offer>(`/recruitments/${recruitmentId}/offer`, { receiverId, message })

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to send offer'
        return null
      }

      return response.data
    } finally {
      isLoading.value = false
    }
  }

  const fetchMyOffers = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.get<Offer[]>('/recruitments/me/offers')

      if (!response.success || !response.data) {
        error.value = response.error?.message || 'Failed to fetch my offers'
        return false
      }

      myOffers.value = response.data
      return true
    } finally {
      isLoading.value = false
    }
  }

  const respondToOffer = async (recruitmentId: string, offerId: string, action: 'ACCEPT' | 'DECLINE') => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.put(`/recruitments/${recruitmentId}/offers/${offerId}`, { action })

      if (!response.success) {
        error.value = response.error?.message || 'Failed to respond to offer'
        return false
      }

      // Update local state
      const index = myOffers.value.findIndex((o) => o.id === offerId)
      if (index !== -1) {
        myOffers.value[index].status = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'
      }

      return true
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Computed
  const openRecruitments = computed(() =>
    recruitments.value.filter((r) => r.status === 'OPEN')
  )

  const pendingApplications = computed(() =>
    applications.value.filter((a) => a.status === 'PENDING')
  )

  const pendingOffers = computed(() => myOffers.value.filter((o) => o.status === 'PENDING'))

  return {
    // State
    recruitments,
    myRecruitments,
    currentRecruitment,
    applications,
    myApplications,
    myOffers,
    pagination,
    isLoading,
    error,
    // Computed
    openRecruitments,
    pendingApplications,
    pendingOffers,
    // Actions
    fetchRecruitments,
    fetchMyRecruitments,
    fetchRecruitment,
    createRecruitment,
    updateRecruitment,
    closeRecruitment,
    cancelRecruitment,
    applyToRecruitment,
    fetchApplications,
    respondToApplication,
    fetchMyApplications,
    sendOffer,
    fetchMyOffers,
    respondToOffer,
    clearError,
  }
})
