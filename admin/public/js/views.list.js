import { state, setActiveCategory } from './state.js';
import { formatDate, resolveOgImage } from './utils.js';

export function renderListView({ onEdit } = {}) {
  const container = document.getElementById('posts-container');
  const posts = filterPostsByCategory(state.activeCategory, state.allPosts);

  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="loading">📝 暂无文章或该分类下无文章</div>';
    return;
  }

  // 草稿分类：不按年分组，直接平铺
  if (state.activeCategory === 'drafts') {
    const itemsHTML = posts.map(postItemHtml).join('');
    container.innerHTML = `
      <div class="post-list">
        ${itemsHTML}
      </div>
    `;
    // 绑定编辑事件
    setTimeout(() => {
      document.querySelectorAll('a.title[data-edit]')?.forEach(a => {
        a.addEventListener('click', () => onEdit?.(a.getAttribute('data-edit')));
      });
    }, 0);
    return;
  }

  const groups = groupPostsByYear(posts);
  container.innerHTML = groups.map(g => sectionHtml(g, onEdit)).join('');

  container.querySelectorAll('.year-header').forEach(h => {
    h.addEventListener('click', () => {
      const yearGroup = h.closest('.year-group');
      const isCollapsed = yearGroup.classList.contains('collapsed');
      const caretSvg = h.querySelector('.caret svg');
      
      yearGroup.classList.toggle('collapsed');
      
      // 切换图标：展开时显示收起图标，收起时显示展开图标
      if (isCollapsed) {
        // 将要展开，显示收起图标
        caretSvg.innerHTML = '<path d="M0 0v1024h1024V0H0z m942.08 942.08H81.92V81.92h860.16v860.16z m-163.84-450.56H245.76v81.92h532.48V491.52z" fill="currentColor"/>';
      } else {
        // 将要收起，显示展开图标
        caretSvg.innerHTML = '<path d="M0 0v1024h1024V0H0z m942.08 942.08H81.92V81.92h860.16v860.16z m-471.04-143.36h81.92v-225.28h225.28V491.52h-225.28V266.24h-81.92v225.28h-225.28v81.92h225.28v225.28z" fill="currentColor"/>';
      }
    });
  });
}

export function bindCategoryTabs({ onCreate, onSettings, onEdit } = {}) {
  const editHandler = typeof onEdit === 'function' ? onEdit : (slug) => {
    window.location.hash = `#/edit/${encodeURIComponent(slug)}`;
  };

  const tabsWrap = document.getElementById('category-tabs');
  if (!tabsWrap) return;
  tabsWrap.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.tab[data-cat]');
    if (tab) {
      const cat = tab.getAttribute('data-cat') || 'all';
      setActiveCategory(cat);
      document.querySelectorAll('.category-tabs .tab[data-cat]').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-cat') === state.activeCategory);
      });
      renderListView({ onEdit: editHandler });
      return;
    }
    const act = ev.target.closest('a[data-action]');
    if (act) {
      const action = act.getAttribute('data-action');
      if (action === 'create') onCreate?.();
      if (action === 'settings') onSettings?.();
    }
  });
}

export function renderCategoryTabs(categories) {
  const tabsWrap = document.getElementById('category-tabs');
  if (!tabsWrap) return;
  tabsWrap.innerHTML = '';

  // 草稿标签置顶
  const draftTab = document.createElement('span');
  draftTab.className = 'tab' + (state.activeCategory === 'drafts' ? ' active' : '');
  draftTab.dataset.cat = 'drafts';
  draftTab.textContent = '草稿';
  tabsWrap.appendChild(draftTab);

  // 全部标签
  const allTab = document.createElement('span');
  allTab.className = 'tab' + (state.activeCategory === 'all' ? ' active' : '');
  allTab.dataset.cat = 'all';
  allTab.textContent = '全部';
  tabsWrap.appendChild(allTab);

  // 其他分类
  categories.forEach(c => {
    const tab = document.createElement('span');
    tab.className = 'tab' + (state.activeCategory === c.name ? ' active' : '');
    tab.dataset.cat = c.name;
    tab.textContent = c.displayName || c.name;
    tabsWrap.appendChild(tab);
  });

  const spacer = document.createElement('div');
  spacer.className = 'spacer';
  tabsWrap.appendChild(spacer);

  const create = document.createElement('a');
  create.href = 'javascript:void(0)';
  create.className = 'nav-link';
  create.dataset.action = 'create';
  create.textContent = '新建';
  tabsWrap.appendChild(create);

  const settings = document.createElement('a');
  settings.href = 'javascript:void(0)';
  settings.className = 'nav-link';
  settings.dataset.action = 'settings';
  settings.textContent = '设置';
  tabsWrap.appendChild(settings);

  const searchIcon = document.createElement('div');
  searchIcon.className = 'search-icon';
  searchIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </svg>
  `;
  searchIcon.setAttribute('aria-label', 'Search');
  tabsWrap.appendChild(searchIcon);
}

function filterPostsByCategory(category, allPosts) {
  if (!category || category === 'all') return allPosts;
  if (category === 'drafts') return allPosts.filter(p => !!p.draft);
  return allPosts.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
}

function groupPostsByYear(posts) {
  const map = {};
  posts.forEach(p => {
    const y = p.year || (p.pubDatetime ? new Date(p.pubDatetime).getFullYear().toString() : '未知');
    map[y] = map[y] || [];
    map[y].push(p);
  });
  const years = Object.keys(map).sort((a, b) => Number(b) - Number(a));
  return years.map(y => ({ year: y, items: map[y] }));
}

function coverHTML(post) {
  const src = resolveOgImage(post.ogImage, post.slug);
  const safeTitle = (post.title || post.slug || '').replace(/"/g, '&quot;');
  const initial = (post.slug || '?').slice(0, 1).toUpperCase();
  return `<div class="thumb"><img src="${src}" alt="${safeTitle}" onerror="this.onerror=null;this.parentElement.innerHTML='${initial}'" /></div>`;
}

// 单条文章项（用于草稿平铺）
function postItemHtml(post) {
  const date = formatDate(post.pubDatetime || '');
  return `
    <div class="post-item">
      ${coverHTML(post)}
      <div class="post-info">
        <a class="title" href="javascript:void(0)" data-edit="${post.slug}">${post.title}</a>
        <div class="date">${date}</div>
      </div>
      <div></div>
    </div>
  `;
}

function sectionHtml(g, onEdit) {
  const itemsHTML = g.items.map(post => {
    const date = formatDate(post.pubDatetime || '');
    return `
      <div class="post-item">
        ${coverHTML(post)}
        <div class="post-info">
          <a class="title" href="javascript:void(0)" data-edit="${post.slug}">${post.title}</a>
          <div class="date">${date}</div>
        </div>
        <div></div>
      </div>
    `;
  }).join('');

  const html = `
    <section class="year-group collapsed">
      <div class="year-header" data-year="${g.year}">
        <span class="caret">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0v1024h1024V0H0z m942.08 942.08H81.92V81.92h860.16v860.16z m-471.04-143.36h81.92v-225.28h225.28V491.52h-225.28V266.24h-81.92v225.28h-225.28v81.92h225.28v225.28z" fill="currentColor"/>
          </svg>
        </span>
        <strong>${g.year}</strong>
        <span style="color:#7a8b99;font-size:13px;">（${g.items.length}）</span>
      </div>
      <div class="year-body">
        <div class="post-list">
          ${itemsHTML}
        </div>
      </div>
    </section>
  `;

  // after insert, bind edit links
  setTimeout(() => {
    document.querySelectorAll('a.title[data-edit]')?.forEach(a => {
      a.addEventListener('click', () => onEdit?.(a.getAttribute('data-edit')));
    });
  }, 0);

  return html;
}