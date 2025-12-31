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
  ],
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Initialize auth state if not done
  if (!authStore.isAuthenticated) {
    await authStore.initialize()
  }

  const isAuthenticated = authStore.isAuthenticated
  const isOnboarded = authStore.isOnboarded

  // Guest only routes (login, register)
  if (to.meta.guestOnly && isAuthenticated) {
    if (!isOnboarded) {
      return next('/onboarding')
    }
    return next('/')
  }

  // Protected routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  // Routes requiring onboarding completion
  if (to.meta.requiresOnboarding && isAuthenticated && !isOnboarded) {
    return next('/onboarding')
  }

  // Prevent accessing onboarding if already onboarded
  if (to.name === 'onboarding' && isAuthenticated && isOnboarded) {
    return next('/')
  }

  next()
})

// ナビゲーション完了後のクリーンアップ
router.afterEach(() => {
  // モーダルが残っている場合にbody.style.overflowをリセット
  document.body.style.overflow = ''
})

export default router
