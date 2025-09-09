import { api } from './api.js';
import { state, setPosts } from './state.js';
import { initRouter } from './router.js';
import { renderListView, bindCategoryTabs, renderCategoryTabs } from './views.list.js';
import { renderEditorView } from './views.editor.js';
import { initNavCard, updateNavCardFromCategory } from './nav-card.js';
import componentManager from '../components/index.js';

function setTabsVisible(visible) {
  const tabs = document.getElementById('category-tabs');
  if (tabs) tabs.style.display = visible ? '' : 'none';
}

// 绑定布局事件
function bindLayoutEvents() {
  // 监听导航变更事件
  document.addEventListener('layout-navigation-change', (e) => {
    const { navType } = e.detail;
    console.log('导航切换到:', navType);
    
    // 根据导航类型更新路由和分类状态
    switch (navType) {
      case 'drafts':
      case 'all':
      case 'life':
      case 'sports':
      case 'startup':
      case 'technology':
        // 更新分类标签状态
        if (layoutInstance) {
          layoutInstance.setCategory(navType);
        }
        // 更新全局状态
        import('./state.js').then(({ setActiveCategory }) => {
          setActiveCategory(navType);
        }).catch(err => {
          console.error('更新分类状态失败:', err);
        });
        location.hash = '#/list';
        break;
      case 'new':
        location.hash = '#/new';
        break;
      case 'search':
        // TODO: 实现搜索功能
        alert('搜索功能开发中...');
        break;
      case 'settings':
        alert('设置功能开发中...');
        break;
    }
  });
  
  // 监听分类变更事件
  document.addEventListener('layout-category-change', (e) => {
    const { category, categoryData } = e.detail;
    console.log('分类切换到:', category, categoryData);
    
    // 更新状态
    import('./state.js').then(({ setActiveCategory }) => {
      setActiveCategory(category);
    }).catch(err => {
      console.error('更新分类状态失败:', err);
    });
    
    // 跳转到列表页面
    const currentHash = window.location.hash;
    if (currentHash !== '#/list' && !currentHash.startsWith('#/list')) {
      location.hash = '#/list';
    } else {
      // 如果已经在列表页面，直接重新渲染列表
      import('./views.list.js').then(({ renderListView }) => {
        renderListView({ onEdit: (slug) => location.hash = `#/edit/${encodeURIComponent(slug)}` });
      }).catch(err => {
        console.error('渲染列表失败:', err);
      });
    }
    
    // 更新导航卡片
    if (window.updateNavCardFromCategory) {
      updateNavCardFromCategory(categoryData);
    }
  });
  
  // 监听分类操作事件
  document.addEventListener('layout-category-action', (e) => {
    const { action } = e.detail;
    console.log('分类操作:', action);
    
    switch (action) {
      case 'create':
        location.hash = '#/new';
        break;
      case 'settings':
        alert('设置功能开发中...');
        break;
    }
  });
  
  // 监听分类搜索事件
  document.addEventListener('layout-category-search', (e) => {
    console.log('搜索功能');
    alert('搜索功能开发中...');
  });
}

// 降级到原始HTML布局
function fallbackToOriginalLayout() {
  console.warn('降级到原始HTML布局');
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.innerHTML = `
      <div class="page">
        <div class="main-card">
          <div class="container">
            <nav class="navigation">
              <!-- 原始导航HTML -->
            </nav>
            <div class="category-tabs" id="category-tabs">
              <!-- 原始分类标签HTML -->
            </div>
            <div id="posts-container">
              <div class="loading">正在加载文章列表...</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 使用原始初始化逻辑
  bindCategoryTabs({ onCreate: () => location.hash = '#/new', onSettings: () => alert('设置开发中…') });
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

// 全局布局实例
let layoutInstance = null;

// 全局滚轮事件处理
function setupGlobalWheelScrolling() {
  let mainContent = null;
  
  // 获取主内容区域的函数
  const getMainContent = () => {
    if (!mainContent || !document.contains(mainContent)) {
      mainContent = document.getElementById('main-content');
    }
    return mainContent;
  };
  
  // 获取编辑器容器的函数
  const getEditorContainer = () => {
    return document.querySelector('.mobile-editor') || document.querySelector('#posts-container');
  };
  
  // 全局滚轮事件监听器
  const handleGlobalWheel = (e) => {
    // 检查是否在编辑模式
    const isEditorMode = document.body.classList.contains('editor-active') || document.body.classList.contains('mobile-editor-active');
    
    let targetContainer;
    if (isEditorMode) {
      // 编辑模式下，使用编辑器容器或直接使用body进行滚动
      targetContainer = getEditorContainer();
      if (!targetContainer) {
        // 如果没有找到编辑器容器，直接让页面自然滚动
        return;
      }
    } else {
      // 非编辑模式下，使用主内容区域
      targetContainer = getMainContent();
      if (!targetContainer) return;
    }
    
    // 检查事件目标是否在目标容器内
    const isInsideTargetContainer = targetContainer.contains(e.target) || e.target === targetContainer;
    
    // 如果滚轮事件不在目标容器内，则转发到目标容器
    if (!isInsideTargetContainer && !isEditorMode) {
      e.preventDefault();
      
      // 计算滚动距离，增加滚动速度
      const scrollSpeed = 4; // 滚动速度倍数
      const deltaY = e.deltaY * scrollSpeed;
      
      // 平滑滚动到目标位置
      const currentScrollTop = targetContainer.scrollTop;
      const targetScrollTop = currentScrollTop + deltaY;
      
      targetContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'auto' // 使用auto而不是smooth以提高响应速度
      });
    }
    // 编辑模式下让浏览器自然处理滚动，不进行拦截
  };
  
  // 添加全局滚轮事件监听器
  document.addEventListener('wheel', handleGlobalWheel, { passive: false });
  
  // 返回清理函数
  return () => {
    document.removeEventListener('wheel', handleGlobalWheel);
  };
}

async function init() {
  try {
    // 初始化组件管理器
    await componentManager.init();
    
    // 创建应用布局
    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
      throw new Error('App container not found');
    }
    
    // 加载数据
    await loadPosts();
    const categories = await loadCategories();
    
    // 创建布局组件
    layoutInstance = await componentManager.createLayout(appContainer, {
      activeNav: 'drafts',
      activeCategory: state.activeCategory, // 使用全局状态中的默认分类
      categories: categories || [],
      content: '<div id="posts-container"><div class="loading">正在加载文章列表...</div></div>'
    });
    
    // 绑定布局事件
    bindLayoutEvents();
    
    // 初始化导航卡片
    initNavCard();
    
    // 设置全局滚轮滚动
    setupGlobalWheelScrolling();
    
    // 初始化路由
    initRouter({
      onList: () => {
        layoutInstance.setCategoryTabsVisible(true);
        setMobileEditorMode(false);
        renderListView({ onEdit: (slug) => location.hash = `#/edit/${encodeURIComponent(slug)}` });
      },
      onNew: () => {
        layoutInstance.setCategoryTabsVisible(false);
        setMobileEditorMode(true);
        renderEditorView(blankPost(), { onBack: () => location.hash = '#/list', onSave: savePost, onDelete: null });
      },
      onEdit: (slug) => {
        layoutInstance.setCategoryTabsVisible(false);
        setMobileEditorMode(true);
        editPost(slug);
      }
    });
    
    console.log('应用初始化完成');
  } catch (error) {
    console.error('应用初始化失败:', error);
    // 降级到原始HTML结构
    fallbackToOriginalLayout();
  }
}

async function loadCategories() {
  try {
    const categories = await api.getCategories();
    // 如果有布局实例，更新分类
    if (layoutInstance) {
      layoutInstance.updateCategories(categories);
    } else {
      // 降级处理
      renderCategoryTabs(categories);
    }
    return categories;
  } catch (e) {
    console.warn('加载分类失败：', e);
    return [];
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