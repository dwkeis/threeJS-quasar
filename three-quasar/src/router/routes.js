
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/', name: "index", component: () => import('pages/IndexPage.vue') },
      { path: '/coin', name: "coin", component: () => import('pages/CoinsPage.vue') },
      { path: '/box', name: "box", component: () => import('pages/DrawBoxPage.vue') }

    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
