// 导航菜单功能模块 - 纯CSS实现版本
 
 // 初始化导航菜单功能
 export function initNavCard() {
   const navigationList = document.querySelector('.navigation-list');
   
   if (!navigationList) {
     console.warn('导航菜单元素未找到');
     return;
   }
 
   // 点击导航项
   navigationList.addEventListener('click', (e) => {
     e.preventDefault();
     const link = e.target.closest('.navigation-item-link');
     if (link) {
       const navType = link.dataset.nav;
       handleNavClick(navType);
       // 关闭菜单
       const checkbox = document.getElementById('menu');
       if (checkbox) {
         checkbox.checked = false;
       }
     }
   });
 }
 
 // 处理导航点击（仅对分类型导航更新高亮与分类；新建/搜索/设置不改动分类高亮）
 function handleNavClick(navType) {
   switch (navType) {
     case 'drafts':
     case 'all':
     case 'life':
     case 'sports':
     case 'startup':
     case 'technology': {
       // 仅分类型：更新活跃状态并切换分类
       updateActiveNavItem(navType);
       switchToCategory(navType);
       break;
     }
     case 'new': {
       // 新建文章 -> 跳转到编辑器（不改变当前分类高亮）
       handleNewPost();
       break;
     }
     case 'search':
     case 'settings':
       // 空链接占位：不改变当前分类高亮和状态
       break;
     default:
       console.warn('未知的导航类型:', navType);
   }
 }
 
 // 更新活跃导航项
 function updateActiveNavItem(activeNavType) {
   const navItems = document.querySelectorAll('.navigation-item');
   navItems.forEach(item => {
     const link = item.querySelector('.navigation-item-link');
     if (link && link.dataset.nav === activeNavType) {
       item.classList.add('current');
     } else {
       item.classList.remove('current');
     }
   });
 }
 
 // 切换到指定分类（同步 tabs 与列表渲染）
function switchToCategory(categoryName) {
  // 动态导入并更新分类状态
  import('./state.js').then(({ setActiveCategory, state }) => {
    setActiveCategory(categoryName);

    // 更新顶部 category-tabs 的高亮
    try {
      document.querySelectorAll('.category-tabs .tab[data-cat]')
        .forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-cat') === state.activeCategory);
        });
    } catch (_) {}

    // 只有当前不在列表页面时才切换路由，避免重复设置相同哈希值
    const currentHash = window.location.hash;
    if (currentHash !== '#/list' && !currentHash.startsWith('#/list')) {
      try {
        window.location.hash = '#/list';
      } catch (_) {}
    } else {
      // 如果已经在列表页面，直接触发列表重新渲染
      try {
        import('./views.list.js').then(({ renderListView }) => {
          renderListView({ onEdit: (slug) => window.location.hash = `#/edit/${encodeURIComponent(slug)}` });
        });
      } catch (_) {}
    }
  }).catch(err => {
    console.error('切换分类失败:', err);
  });
}
 
 // 处理新建文章
 function handleNewPost() {
   // 使用哈希导航到新建页面
   try {
     window.location.hash = '#/new';
   } catch (err) {
     console.error('导航到编辑器失败:', err);
   }
 }
 
 // 从分类更新导航卡片状态（供外部调用）
 export function updateNavCardFromCategory(activeCategory) {
   // 分类名与导航类型保持一致：drafts, all, life, sports, startup, technology
   const valid = new Set(['drafts', 'all', 'life', 'sports', 'startup', 'technology']);
   const navType = valid.has(activeCategory) ? activeCategory : 'all';
   updateActiveNavItem(navType);
 }
 
 // 导出隐藏函数（兼容性保留）
 export function hideNavCard() {
   const checkbox = document.getElementById('menu');
   if (checkbox) {
     checkbox.checked = false;
   }
 }