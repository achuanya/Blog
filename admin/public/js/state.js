// Global state for the Admin app
export const state = {
  apiBase: '/api',
  siteBase: 'https://lhasa.icu',
  view: 'list', // 'list' | 'editor'
  allPosts: [],
  activeCategory: 'all',
  currentEditSlug: null,
};

export function setPosts(posts) {
  state.allPosts = Array.isArray(posts) ? posts : [];
}

export function setActiveCategory(cat) {
  state.activeCategory = cat || 'all';
}

export function setView(v) {
  state.view = v;
}

export function setCurrentEditSlug(slug) {
  state.currentEditSlug = slug || null;
}