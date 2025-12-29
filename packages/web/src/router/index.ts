import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
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
      path: '/want-to-dos',
      name: 'want-to-dos',
      component: () => import('../pages/WantToDosPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/want-to-dos/:id',
      name: 'want-to-do-detail',
      component: () => import('../pages/WantToDoDetailPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/recruitments',
      name: 'recruitments',
      component: () => import('../pages/RecruitmentsPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/recruitments/new',
      name: 'create-recruitment',
      component: () => import('../pages/CreateRecruitmentPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/recruitments/:id',
      name: 'recruitment-detail',
      component: () => import('../pages/RecruitmentDetailPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/recruitments/:id/applications',
      name: 'recruitment-applications',
      component: () => import('../pages/RecruitmentApplicationsPage.vue'),
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

export default router
