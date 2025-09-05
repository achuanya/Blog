import { state, setActiveCategory } from './state.js';
import { formatDate, resolveOgImage } from './utils.js';

export function renderListView({ onEdit }) {
  const container = document.getElementById('posts-container');
  const posts = filterPostsByCategory(state.activeCategory, state.allPosts);

  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="loading">📝 暂无文章或该分类下无文章</div>';
    return;
  }

  const groups = groupPostsByYear(posts);
  container.innerHTML = groups.map(g => sectionHtml(g, onEdit)).join('');

  container.querySelectorAll('.year-header').forEach(h => {
    h.addEventListener('click', () => h.closest('.year-group').classList.toggle('collapsed'));
  });
}

export function bindCategoryTabs({ onCreate, onSettings }) {
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
      renderListView({ onEdit: (slug) => onEdit(slug) });
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
  const allTab = document.createElement('span');
  allTab.className = 'tab active';
  allTab.dataset.cat = 'all';
  allTab.textContent = '全部';
  tabsWrap.appendChild(allTab);

  categories.forEach(c => {
    const tab = document.createElement('span');
    tab.className = 'tab';
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

  const search = document.createElement('input');
  search.type = 'search';
  search.id = 'nav-search';
  search.className = 'search-input';
  search.placeholder = 'Search';
  search.setAttribute('aria-label', 'Search');
  tabsWrap.appendChild(search);
}

function filterPostsByCategory(category, allPosts) {
  if (!category || category === 'all') return allPosts;
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
        <span class="caret">▶</span>
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