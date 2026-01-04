import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import DeckList from '@/views/DeckList.vue';
import PracticeSession from '@/views/PracticeSession.vue';
import SessionResults from '@/views/SessionResults.vue';
import DeckManagement from '@/views/DeckManagement.vue';
import CardBrowser from '@/views/CardBrowser.vue';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
