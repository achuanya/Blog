// API layer for Blog Admin
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const api = {
  async getCategories() {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('加载分类失败');
    return res.json();
  },
  async getPosts({ limit = 1000 } = {}) {
    const res = await fetch(`/api/posts?limit=${encodeURIComponent(limit)}`);
    if (!res.ok) throw new Error('加载文章失败');
    return res.json();
  },
  async getPost(slug) {
    const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('加载文章失败');
    return res.json();
  },
  async createPost(payload) {
    const res = await fetch('/api/posts', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.json()).error || '创建失败');
    return res.json();
  },
  async updatePost(slug, payload) {
    const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.json()).error || '更新失败');
    return res.json();
  },
  async deletePost(slug) {
    const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || '删除失败');
    return res.json();
  }
};