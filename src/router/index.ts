import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import DeckList from '@/views/DeckList.vue';
import PracticeSession from '@/views/PracticeSession.vue';
import SessionResults from '@/views/SessionResults.vue';
import DeckManagement from '@/views/DeckManagement.vue';
import CardBrowser from '@/views/CardBrowser.vue';
import Progress from '@/views/Progress.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import MyProfile from '@/views/MyProfile.vue';
import UserManagement from '@/views/UserManagement.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'DeckList',
    component: DeckList
  },
  {
    path: '/practice/:deckId',
    name: 'PracticeSession',
    component: PracticeSession,
    props: true
  },
  {
    path: '/results',
    name: 'SessionResults',
    component: SessionResults
  },
  {
    path: '/manage',
    name: 'DeckManagement',
    component: DeckManagement
  },
  {
    path: '/manage/:deckId/cards',
    name: 'CardBrowser',
    component: CardBrowser
  },
  {
    path: '/progress',
    name: 'Progress',
    component: Progress
  },
  {
    path: '/profile',
    name: 'MyProfile',
    component: MyProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * Navigation guard to handle authentication
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Check authentication status if we haven't yet
  if (authStore.user === null && authStore.loading === false) {
    await authStore.checkAuth();
  }

  // Redirect authenticated users away from login/register pages
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'DeckList' });
    return;
  }

  // Redirect unauthenticated users away from auth-required pages
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' });
    return;
  }

  // Redirect non-admin users away from admin-required pages
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'DeckList' });
    return;
  }

  next();
});

export default router;
