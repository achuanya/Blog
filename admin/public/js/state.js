// Global state for the Admin app
export const state = {
  apiBase: '/api',
  siteBase: 'https://lhasa.icu',
  view: 'list', // 'list' | 'editor'
  allPosts: [],
  activeCategory: 'drafts',
  currentEditSlug: null,
};

export function setPosts(posts) {
  state.allPosts = Array.isArray(posts) ? posts : [];
}

export function setActiveCategory(cat) {
  state.activeCategory = cat || 'all';
  
  // 动态导入并更新导航卡片状态
  import('./nav-card.js').then(({ updateNavCardFromCategory }) => {
    updateNavCardFromCategory(state.activeCategory);
  }).catch(() => {
    // 如果导航卡片模块未加载，忽略错误
  });
}

export function setView(v) {
  state.view = v;
}

export function setCurrentEditSlug(slug) {
  state.currentEditSlug = slug || null;
}