import { api } from './api.js';
import { state, setPosts } from './state.js';
import { initRouter } from './router.js';
import { renderListView, bindCategoryTabs, renderCategoryTabs } from './views.list.js';
import { renderEditorView } from './views.editor.js';

async function init() {
  await loadPosts();
  await loadCategories();
  bindCategoryTabs({ onCreate: () => location.hash = '#/new', onSettings: () => alert('设置开发中…') });

  initRouter({
    onList: () => renderListView({ onEdit: (slug) => location.hash = `#/edit/${encodeURIComponent(slug)}` }),
    onNew: () => renderEditorView(blankPost(), { onBack: () => location.hash = '#/list', onSave: savePost, onDelete: null }),
    onEdit: (slug) => editPost(slug)
  });
}

async function loadCategories() {
  try {
    const categories = await api.getCategories();
    renderCategoryTabs(categories);
  } catch (e) {
    console.warn('加载分类失败：', e);
  }
}

async function loadPosts() {
  try {
    const data = await api.getPosts({ limit: 1000 });
    setPosts(Array.isArray(data.posts) ? data.posts : []);
  } catch (e) {
    console.error('加载文章失败:', e);
    document.getElementById('posts-container').innerHTML = '<div class="loading">❌ 加载失败，请检查服务器连接</div>';
  }
}

function blankPost() {
  return { title: '', category: 'technology', description: '', tags: [], featured: false, draft: false, ogImage: '', slug: '', content: '' };
}

async function editPost(slug) {
  try {
    const post = await api.getPost(slug);
    renderEditorView(post, { onBack: () => location.hash = '#/list', onSave: () => savePost(slug), onDelete: () => onDelete(slug) });
  } catch (e) {
    console.error('加载文章失败:', e);
    alert('加载文章失败，请重试');
  }
}

async function onDelete(slug) {
  const ok = confirm('确定要删除这篇文章吗？此操作不可恢复！');
  if (!ok) return;
  try {
    await api.deletePost(slug);
    await loadPosts();
    location.hash = '#/list';
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
}

async function savePost(editingSlug) {
  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value.trim();
  const tags = document.getElementById('tags').value.trim();
  const featured = document.getElementById('featured').checked;
  const draft = document.getElementById('draft').checked;
  const ogImage = document.getElementById('ogImage').value.trim();
  const canonicalURL = document.getElementById('canonicalURL').value.trim();
  const content = document.getElementById('content').value;
  const useMDX = document.getElementById('useMDX').checked;

  const payload = { title, category, description, tags, featured, draft, ogImage, canonicalURL, content, useMDX };

  try {
    if (editingSlug) await api.updatePost(editingSlug, payload);
    else await api.createPost(payload);
    await loadPosts();
    location.hash = '#/list';
    alert('保存成功');
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
}

window.addEventListener('DOMContentLoaded', init);