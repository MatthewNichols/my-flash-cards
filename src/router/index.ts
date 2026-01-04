import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import DeckList from '@/views/DeckList.vue';
import PracticeSession from '@/views/PracticeSession.vue';
import SessionResults from '@/views/SessionResults.vue';

const routes: RouteRecordRaw[] = [
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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
