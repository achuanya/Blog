import { api } from './api.js';
import { state, setPosts } from './state.js';
import { initRouter } from './router.js';
import { renderListView, bindCategoryTabs, renderCategoryTabs } from './views.list.js';
import { renderEditorView } from './views.editor.js';
import { initNavCard, updateNavCardFromCategory } from './nav-card.js';

function setTabsVisible(visible) {
  const tabs = document.getElementById('category-tabs');
  if (tabs) tabs.style.display = visible ? '' : 'none';
}

// ===== 移动端编辑视图全屏模式开关 =====
let __mobileEditorResizeAdded = false;
let __isEditorMode = false;
function updateMobileEditorClass() {
  const isMobile = window.innerWidth < 768;
  // 同时维护移动端与桌面端两种编辑态 class
  document.body.classList.toggle('mobile-editor-active', __isEditorMode && isMobile);
  document.body.classList.toggle('editor-active', __isEditorMode && !isMobile);
  // 同步更新 PC 编辑布局（移动端类切换后仍需要处理桌面端）
  updateDesktopEditorLayout();
}

// ===== 新增：PC 编辑模式把 posts-container 移出 .container 并隐藏 .container =====
function updateDesktopEditorLayout() {
  try {
    const isDesktop = window.innerWidth >= 768;
    const mainCard = document.querySelector('.main-card');
    const container = document.querySelector('.main-card .container');
    const posts = document.getElementById('posts-container');
    if (!mainCard || !container || !posts) return;

    if (__isEditorMode && isDesktop) {
      // 放一个锚点用于恢复
      if (!document.getElementById('pc-container-anchor')) {
        const anchor = document.createElement('div');
        anchor.id = 'pc-container-anchor';
        anchor.style.display = 'none';
        // 在移动之前放在 posts 的原位置
        posts.before(anchor);
      }
      // 将 posts-container 挪到 .main-card 下（与 .container 同级）
      if (posts.parentElement !== mainCard) {
        mainCard.appendChild(posts);
      }
      // 隐藏原 container
      container.style.display = 'none';
    } else {
      // 恢复：把 posts-container 放回原位，并显示 container
      const anchor = document.getElementById('pc-container-anchor');
      if (anchor) {
        anchor.parentElement?.insertBefore(posts, anchor);
        anchor.remove();
      }
      if (container.style.display === 'none') container.style.display = '';
    }
  } catch (_) {
    // 忽略布局切换中的非致命错误
  }
}

function setMobileEditorMode(active) {
  __isEditorMode = !!active;
  updateMobileEditorClass();
  if (!__mobileEditorResizeAdded) {
    window.addEventListener('resize', updateMobileEditorClass);
    __mobileEditorResizeAdded = true;
  }
}

async function init() {
  await loadPosts();
  await loadCategories();
  bindCategoryTabs({ onCreate: () => location.hash = '#/new', onSettings: () => alert('设置开发中…') });

  // 初始化导航卡片
  initNavCard();

  initRouter({
    onList: () => {
      setTabsVisible(true);
      setMobileEditorMode(false);
      renderListView({ onEdit: (slug) => location.hash = `#/edit/${encodeURIComponent(slug)}` });
    },
    onNew: () => {
      setTabsVisible(false);
      setMobileEditorMode(true);
      renderEditorView(blankPost(), { onBack: () => location.hash = '#/list', onSave: savePost, onDelete: null });
    },
    onEdit: (slug) => {
      setTabsVisible(false);
      setMobileEditorMode(true);
      editPost(slug);
    }
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
  const $ = (id) => document.getElementById(id);
  const pick = (metaId, id, map = (v) => v) => {
    const metaEl = $(metaId);
    if (metaEl) return map(metaEl.type === 'checkbox' ? metaEl.checked : (metaEl.value ?? ''));
    const el = $(id);
    return map(el?.type === 'checkbox' ? !!el?.checked : (el?.value ?? ''));
  };

  const title = pick('title-meta', 'title', v => (typeof v === 'string' ? v.trim() : v));
  const category = pick('category-meta', 'category', v => (typeof v === 'string' ? v : ''));
  const description = pick('description-meta', 'description', v => (typeof v === 'string' ? v.trim() : ''));
  const tags = pick('tags-meta', 'tags', v => (typeof v === 'string' ? v.trim() : ''));
  const featured = pick('featured-meta', 'featured', v => !!v);
  const draft = pick('draft-meta', 'draft', v => !!v);
  const ogImage = pick('ogImage-meta', 'ogImage', v => (typeof v === 'string' ? v.trim() : ''));
  const canonicalURL = pick('canonicalURL-meta', 'canonicalURL', v => (typeof v === 'string' ? v.trim() : ''));
  const content = window.getEditorContent ? window.getEditorContent() : pick('content', 'content', v => (typeof v === 'string' ? v : ''));
  const useMDX = pick('useMDX-meta', 'useMDX', v => !!v);

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