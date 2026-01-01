import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/HomePage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/RegisterPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../pages/OnboardingPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../pages/AuthCallbackPage.vue'),
    },
    {
      path: '/recruitments/new',
      name: 'create-recruitment',
      component: () => import('../pages/CreateRecruitmentPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/recruitments/:id/applications',
      name: 'recruitment-applications',
      component: () => import('../pages/RecruitmentApplicationsPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/groups',
      name: 'groups',
      component: () => import('../pages/GroupsPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/groups/:id',
      name: 'group-chat',
      component: () => import('../pages/GroupChatPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../pages/NotificationsPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  console.log('[Router] beforeEach:', { from: from.fullPath, to: to.fullPath, toName: to.name })

  const authStore = useAuthStore()

  // Initialize auth state if not done
  if (!authStore.isAuthenticated) {
    console.log('[Router] Initializing auth...')
    await authStore.initialize()
    console.log('[Router] Auth initialized:', { isAuthenticated: authStore.isAuthenticated, isOnboarded: authStore.isOnboarded })
  }

  const isAuthenticated = authStore.isAuthenticated
  const isOnboarded = authStore.isOnboarded

  // Guest only routes (login, register)
  if (to.meta.guestOnly && isAuthenticated) {
    if (!isOnboarded) {
      console.log('[Router] Redirecting to onboarding (guest route + authenticated)')
      return next('/onboarding')
    }
    console.log('[Router] Redirecting to home (guest route + authenticated + onboarded)')
    return next('/')
  }

  // Protected routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('[Router] Redirecting to login (protected route + not authenticated)')
    return next('/login')
  }

  // Routes requiring onboarding completion
  if (to.meta.requiresOnboarding && isAuthenticated && !isOnboarded) {
    console.log('[Router] Redirecting to onboarding (requires onboarding)')
    return next('/onboarding')
  }

  // Prevent accessing onboarding if already onboarded
  if (to.name === 'onboarding' && isAuthenticated && isOnboarded) {
    console.log('[Router] Redirecting to home (already onboarded)')
    return next('/')
  }

  console.log('[Router] Proceeding to:', to.fullPath)
  next()
})

// ナビゲーション完了後のクリーンアップ
router.afterEach((to, from) => {
  console.log('[Router] afterEach:', { from: from.fullPath, to: to.fullPath })
  // モーダルが残っている場合にbody.style.overflowをリセット
  document.body.style.overflow = ''
})

export default router
