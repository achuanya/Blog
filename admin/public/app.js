class BlogAdmin {
    constructor() {
        this.apiBase = '/api';
        this.currentEditSlug = null;
         // 新增：视图状态（list | editor）
        this.view = 'list';
        // 新增：用于分类筛选与 UI 渲染的状态
        this.allPosts = [];
        this.activeCategory = 'all';
        // 站点基址：用于 “slug 作为封面” 的图片 URL，默认指向线上站点的动态图片 /[slug].png
        this.siteBase = 'https://lhasa.icu';
        this.init();
    }
    
    async init() {
        await this.loadPosts();
        await this.loadCategories(); // 新增：先把分类加载好
        this.bindEvents();
        // 新增：根据当前 hash 决定渲染列表或编辑页
        this.handleRoute(location.hash);
    }
    
    bindEvents() {
        // 顶部 tabs
        const tabsWrap = document.getElementById('category-tabs');
        if (tabsWrap) {
            tabsWrap.addEventListener('click', (ev) => {
                const tab = ev.target.closest('.tab[data-cat]');
                if (tab) {
                    this.switchCategory(tab.getAttribute('data-cat') || 'all');
                    return;
                }
                const act = ev.target.closest('a[data-action]');
                if (act) {
                    const action = act.getAttribute('data-action');
                    if (action === 'create') {
                        // 新建：切到编辑视图
                        location.hash = '#/new';
                    }
                    if (action === 'settings') this.openSettings();
                }
            });
        }

        // 新增：hash 路由
        window.addEventListener('hashchange', () => {
            this.handleRoute(location.hash);
        });
    }

    // 新增：哈希路由 -> 列表/新建/编辑
    handleRoute(hash) {
        const container = document.getElementById('posts-container');
        if (!hash || hash === '#' || hash === '#/' || hash.startsWith('#/list')) {
            this.view = 'list';
            this.renderPosts();
            return;
        }

        if (hash.startsWith('#/new')) {
            this.view = 'editor';
            this.currentEditSlug = null;
            // 渲染空白编辑器
            this.renderEditorView({
                title: '',
                category: 'technology',
                description: '',
                tags: [],
                featured: false,
                draft: false,
                ogImage: '',
                slug: '',
                content: ''
            });
            return;
        }

        const editMatch = hash.match(/^#\/edit\/(.+)$/);
        if (editMatch) {
            const slug = decodeURIComponent(editMatch[1]);
            this.view = 'editor';
            this.editPost(slug, { hydrateOnly: true }); // 仅注水编辑视图
            return;
        }

        // 兜底：列表
        this.view = 'list';
        this.renderPosts();
    }
    
    async loadCategories() {
        try {
            const res = await fetch(`${this.apiBase}/categories`);
            const categories = await res.json(); // [{name, displayName}, ...]

            const tabsWrap = document.getElementById('category-tabs');
            if (tabsWrap) {
                tabsWrap.innerHTML = '';
                // 全部
                const allTab = document.createElement('span');
                allTab.className = 'tab active';
                allTab.dataset.cat = 'all';
                allTab.textContent = '全部';
                tabsWrap.appendChild(allTab);

                // 分类
                categories.forEach(c => {
                    const tab = document.createElement('span');
                    tab.className = 'tab';
                    tab.dataset.cat = c.name;
                    tab.textContent = c.displayName || c.name;
                    tabsWrap.appendChild(tab);
                });

                // 推到右侧的占位
                const spacer = document.createElement('div');
                spacer.className = 'spacer';
                // 删除：由 CSS 负责 .spacer 的弹性，不再内联设置
                // spacer.style.flex = '1 1 auto';
                tabsWrap.appendChild(spacer);

                // 新建
                const create = document.createElement('a');
                create.href = 'javascript:void(0)';
                create.className = 'nav-link';
                create.dataset.action = 'create';
                create.textContent = '新建';
                tabsWrap.appendChild(create);

                // 设置
                const settings = document.createElement('a');
                settings.href = 'javascript:void(0)';
                settings.className = 'nav-link';
                settings.dataset.action = 'settings';
                settings.textContent = '设置';
                tabsWrap.appendChild(settings);

                // 最右侧隐形搜索框
                const search = document.createElement('input');
                search.type = 'search';
                search.id = 'nav-search';
                search.className = 'search-input';
                search.placeholder = 'Search';
                search.setAttribute('aria-label', 'Search');
                tabsWrap.appendChild(search);
            }
        } catch (e) {
            console.warn('加载分类失败：', e);
        }
    }
    
    async loadPosts() {
        try {
            const response = await fetch(`${this.apiBase}/posts?limit=1000`);
            const data = await response.json();
            // 保存完整集合
            this.allPosts = Array.isArray(data.posts) ? data.posts : [];
            // 不在此处直接渲染，等分类/事件绑定完成后再统一 render
        } catch (error) {
            console.error('加载文章失败:', error);
            document.getElementById('posts-container').innerHTML = 
                '<div class="loading">❌ 加载失败，请检查服务器连接</div>';
        }
    }
    
    // 切换分类，并触发渲染与 UI 同步
    switchCategory(cat) {
        this.activeCategory = cat || 'all';
        // 顶部 tabs 激活态
        document.querySelectorAll('.category-tabs .tab[data-cat]').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-cat') === this.activeCategory);
        });
        // 右侧列表激活态
        document.querySelectorAll('#category-list a[data-cat]').forEach(a => {
            a.classList.toggle('active', a.getAttribute('data-cat') === this.activeCategory);
        });
        this.renderPosts();
    }

    // 根据分类过滤
    filterPostsByCategory(category) {
        if (!category || category === 'all') return this.allPosts;
        return this.allPosts.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    // 按年分组
    groupPostsByYear(posts) {
        const map = {};
        posts.forEach(p => {
            const y = p.year || (p.pubDatetime ? new Date(p.pubDatetime).getFullYear().toString() : '未知');
            map[y] = map[y] || [];
            map[y].push(p);
        });
        // 年份从新到旧排序
        const years = Object.keys(map).sort((a, b) => Number(b) - Number(a));
        return years.map(y => ({ year: y, items: map[y] }));
    }

    // 30 Aug, 2025 格式
    formatDate(dateStr) {
        // 兼容 'YYYY-MM-DD HH:mm:ss'
        const d = new Date(dateStr.replace(' ', 'T'));
        const dd = d.getDate().toString().padStart(2, '0');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const mmm = months[d.getMonth() || 0];
        const yyyy = d.getFullYear();
        return `${dd} ${mmm}, ${yyyy}`;
    }

    // slug 作为封面：优先使用站点 /[slug].png（Astro 动态 OG），失败退回文字占位
    resolveOgImage(ogImage, slug) {
        if (!ogImage) return `${this.siteBase}/${slug}.png`;
        if (typeof ogImage === 'string') return ogImage;
        if (Array.isArray(ogImage) && ogImage.length > 0) return this.resolveOgImage(ogImage[0], slug);
        if (typeof ogImage === 'object' && ogImage.src) return ogImage.src;
        return `${this.siteBase}/${slug}.png`;
    }

    // 封面：使用 ogImage（失败回退到 /[slug].png，再失败显示首字母）
    getCoverImgHTML(slug, title, ogImage) {
        const src = this.resolveOgImage(ogImage, slug);
        const safeTitle = (title || slug || '').replace(/"/g, '&quot;');
        const initial = (slug || '?').slice(0, 1).toUpperCase();
        return `
            <div class="thumb">
                <img src="${src}" alt="${safeTitle}" onerror="this.onerror=null;this.parentElement.innerHTML='${initial}'" />
            </div>
        `;
    }

    renderPosts() {
        const container = document.getElementById('posts-container');
        const posts = this.filterPostsByCategory(this.activeCategory);

        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="loading">📝 暂无文章或该分类下无文章</div>';
            return;
        }

        const groups = this.groupPostsByYear(posts);

        const html = groups.map((g, idx) => {
            const collapsedClass = 'collapsed';
            const itemsHTML = g.items.map(post => {
                const date = this.formatDate(post.pubDatetime || '');
                return `
                    <div class="post-item">
                        ${this.getCoverImgHTML(post.slug, post.title, post.ogImage)}
                        <div class="post-info">
                            <a class="title" href="javascript:void(0)" onclick="blogAdmin.editPost('${post.slug}')">${post.title}</a>
                            <div class="date">${date}</div>
                        </div>
                        <div></div>
                    </div>
                `;
            }).join('');

            return `
                <section class="year-group ${collapsedClass}">
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
        }).join('');

        container.innerHTML = html;

        container.querySelectorAll('.year-header').forEach(h => {
            h.addEventListener('click', () => {
                const group = h.closest('.year-group');
                group.classList.toggle('collapsed');
            });
        });
    }
    
    getCategoryName(category) {
        const names = {
            technology: '技术',
            life: '生活',
            sports: '运动',
            startup: '创业'
        };
        return names[category] || category;
    }
    
    showCreateModal() {
        // 改为路由到新建视图
        location.hash = '#/new';
    }
    
    async editPost(slug, { hydrateOnly = false } = {}) {
        try {
            const response = await fetch(`${this.apiBase}/posts/${slug}`);
            const post = await response.json();
            
            this.currentEditSlug = slug;
            if (hydrateOnly || this.view !== 'editor') {
                this.renderEditorView(post);
            } else {
                document.getElementById('modal-title').textContent = '编辑文章';
                
                // 填充表单
                document.getElementById('title').value = post.title || '';
                document.getElementById('category').value = post.category || 'technology';
                document.getElementById('description').value = post.description || '';
                document.getElementById('tags').value = Array.isArray(post.tags) ? post.tags.join(', ') : '';
                document.getElementById('featured').checked = Boolean(post.featured);
                document.getElementById('draft').checked = Boolean(post.draft);
                document.getElementById('ogImage').value = post.ogImage || '';
                document.getElementById('canonicalURL').value = post.slug || '';
                document.getElementById('timezone').value = 'Asia/Shanghai';  // 固定为北京时间
                document.getElementById('content').value = post.content || '';
                
                document.getElementById('post-modal').style.display = 'block';
            }
        } catch (error) {
            console.error('加载文章失败:', error);
            alert('加载文章失败，请重试');
        }
    }
    
    // 新增：在容器内渲染 GitHub 风格编辑器
    renderEditorView(post) {
        const container = document.getElementById('posts-container');
        container.innerHTML = this.buildEditorHTML(post);
    
        // 绑定交互
        const backBtn = container.querySelector('#back-to-list');
        backBtn?.addEventListener('click', () => {
            history.pushState(null, '', '#/list');
            this.renderPosts();
        });
    
        const saveBtn = container.querySelector('#save-post');
        saveBtn?.addEventListener('click', () => this.savePost());
    
        const delBtn = container.querySelector('#delete-post');
        if (delBtn) {
            delBtn.addEventListener('click', async () => {
                if (!this.currentEditSlug) return;
                const ok = confirm('确定要删除这篇文章吗？此操作不可恢复！');
                if (!ok) return;
                try {
                    const res = await fetch(`${this.apiBase}/posts/${this.currentEditSlug}`, { method: 'DELETE' });
                    if (!res.ok) {
                        const e = await res.json();
                        throw new Error(e.error || '删除失败');
                    }
                    await this.loadPosts();
                    history.pushState(null, '', '#/list');
                    this.renderPosts();
                    alert('文章删除成功！');
                } catch (e) {
                    alert('删除失败: ' + e.message);
                }
            });
        }
    
        // 支持 Ctrl/Cmd + S 保存
        container.querySelector('#editor-form')?.addEventListener('keydown', (ev) => {
            const isSave = (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's';
            if (isSave) {
                ev.preventDefault();
                this.savePost();
            }
        });
    
        // ===== 新增：Markdown 预览 & 分屏逻辑 =====
        const md = window.markdownit ? window.markdownit({ html: true, linkify: true, breaks: true }) : null;
        const editorBody = container.querySelector('#editor-body');
        const textarea = container.querySelector('#content');
        const previewPane = container.querySelector('#editor-preview');
        const previewEl = container.querySelector('#md-preview');
        const splitToggle = container.querySelector('#split-toggle');
        const tabs = container.querySelectorAll('.editor-tabs .tab');
    
        // 新增：插入 Import 语句的按钮
        const insertImportBtn = container.querySelector('#insert-import');
        insertImportBtn?.addEventListener('click', () => {
            const el = textarea;
            if (!el) return;
            const snippet = '\nimport Img from "@/components/Img.astro";\n';
            const start = el.selectionStart ?? 0;
            const end = el.selectionEnd ?? 0;
            
            // 检查是否已经存在该 import 语句
            if (el.value.includes('import Img from "@/components/Img.astro"')) {
                alert('Import 语句已存在！');
                return;
            }
            
            // 将 import 语句插入到文档开头
            const lines = el.value.split('\n');
            let insertIndex = 0;
            
            // 找到合适的插入位置（在其他 import 语句之后）
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('import ')) {
                    insertIndex = i + 1;
                } else if (lines[i].trim() === '' && insertIndex > 0) {
                    // 如果找到了 import 语句，在空行后插入
                    break;
                } else if (lines[i].trim() !== '' && !lines[i].trim().startsWith('import ')) {
                    // 如果遇到非 import 的内容，停止查找
                    break;
                }
            }
            
            lines.splice(insertIndex, 0, snippet.trim());
            el.value = lines.join('\n');
            el.focus();
            
            // 将光标定位到插入的 import 语句末尾
            const newCursorPos = lines.slice(0, insertIndex + 1).join('\n').length;
            el.selectionStart = el.selectionEnd = newCursorPos;
            
            // 触发预览刷新
            requestAnimationFrame(renderPreview);
        });
    
        // 新增：插入 Img 组件的按钮
        const insertImgBtn = container.querySelector('#insert-img-astro');
        insertImgBtn?.addEventListener('click', () => {
          const el = textarea;
          if (!el) return;
          const snippet = '\n<Img src={`${IMAGES}/${frontmatter.slug}/`} alt="" exif={true} caption={true} />\n';
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          el.value = el.value.slice(0, start) + snippet + el.value.slice(end);
          el.focus();
          el.selectionStart = el.selectionEnd = start + snippet.length;
          // 触发预览刷新
          requestAnimationFrame(renderPreview);
        });

        // 预处理：将 <Img .../> 转换为可预览的 HTML
        function transformImgAstroShortcode(srcText) {
          return srcText.replace(/<Img\s+([^>]*?)\/>/g, (_m, attrs) => {
            const pick = (name) => {
              const m = attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`,'i'));
              return m ? m[1] : '';
            };
            
            const src = pick('src') || '';
            const alt = pick('alt') || '';
            const caption = pick('caption');
            const hasCaption = !!caption || !!alt;
            
            // 获取当前文章的slug - 修正：使用正确的元素id
            const slugInput = document.querySelector('#canonicalURL');
            const currentSlug = slugInput ? slugInput.value.trim() : '';
            
            // 拼接完整的图片URL
            let fullImageUrl = src;
            if (src && currentSlug && !src.startsWith('http')) {
              // 如果src不是完整URL且存在slug，则拼接完整路径
              fullImageUrl = `https://cos.lhasa.icu/ArticlePictures/${currentSlug}/${src}`;
            }

            // 简化版的预览 HTML（不改变保存内容）
            const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
            const imgHtml = `
<figure style="margin:1rem 0;text-align:center">
  <div style="position:relative;display:inline-block;max-width:100%">
    <img src="${esc(fullImageUrl)}" alt="${esc(alt)}" title="${esc(alt)}"
         style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)" />
    ${hasCaption ? `<figcaption style="margin-top:6px;font-size:12px;color:#6b7280">${esc(alt)}</figcaption>` : ``}
  </div>
</figure>`.trim();
            return imgHtml;
          });
        }

        const setActiveTab = (name) => {
            tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === name));
        };
        const updateLayout = () => {
            if (!editorBody || !previewPane) return;
            if (splitToggle && splitToggle.checked) {
                editorBody.classList.add('split');
                previewPane.style.display = '';
            } else {
                editorBody.classList.remove('split');
                const active = container.querySelector('.editor-tabs .tab.active')?.getAttribute('data-tab');
                previewPane.style.display = active === 'preview' ? '' : 'none';
            }
        };
        const renderPreview = () => {
            if (!md || !previewEl) return;
            const src = textarea?.value || '';
            // 预处理 MDX Img 组件后再交给 markdown-it 渲染
            const processed = transformImgAstroShortcode(src);
            try {
                previewEl.innerHTML = md.render(processed);
            } catch (e) {
                previewEl.textContent = '渲染失败：' + (e?.message || e);
            }
        };

        textarea?.addEventListener('input', () => {
            // 简单去抖：下一帧渲染
            requestAnimationFrame(renderPreview);
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const name = tab.getAttribute('data-tab');
                setActiveTab(name);
                updateLayout();
                if (name === 'preview') renderPreview();
            });
        });

        splitToggle?.addEventListener('change', () => {
            updateLayout();
            if (splitToggle.checked) renderPreview();
        });

        // 初始状态：撰写 Tab、未分屏
        setActiveTab('write');
        updateLayout();
        renderPreview();
    }

    // 新增：拼装编辑视图 HTML
    buildEditorHTML(post) {
        const isEdit = Boolean(this.currentEditSlug);
        const v = (s) => (s ?? '').toString().replace(/"/g, '&quot;');
        const tags = Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || '');
        // 是否为 MDX（编辑已有文章时根据现有文件名判断；新建默认不选中）
        const isMDX = isEdit ? ((post.filename || '').toLowerCase().endsWith('.mdx')) : false;
        return `
            <section class="editor-view">
                <div class="editor-header">
                    <button type="button" id="back-to-list" class="btn">← 返回</button>
                    <div class="spacer"></div>
                    ${isEdit ? '<button type="button" id="delete-post" class="btn btn-danger" style="margin-right:8px;">删除</button>' : ''}
                    <button type="button" id="save-post" class="btn btn-success">💾 保存</button>
                </div>

                <form id="editor-form" class="editor-form">
                    <!-- 1) 内容置顶（GitHub 风格大编辑区） -->
                    <div class="form-group">
                        <label for="content">内容（Markdown / MDX）</label>
                        <div class="editor-tabs">
                            <span class="tab active" data-tab="write">撰写</span>
                            <span class="tab" data-tab="preview">预览</span>
                            <div class="spacer"></div>
                            <button type="button" id="insert-import" class="btn">插入 Import</button>
                            <button type="button" id="insert-img-astro" class="btn">插入 Img 组件</button>
                            <label class="toggle" style="margin-left:.5rem;"><input type="checkbox" id="split-toggle" /> 分屏</label>
                        </div>
                        <div class="editor-body" id="editor-body">
                            <div class="editor-pane">
                                <textarea id="content" name="content" class="gh-editor" spellcheck="false">${v(post.content || '')}</textarea>
                            </div>
                            <div class="editor-pane editor-preview" id="editor-preview" style="display:none;">
                                <div class="md-preview" id="md-preview"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 2) 标题 / Slug -->
                    <div class="form-row-2col">
                        <div class="form-group">
                            <label for="title">标题 *</label>
                            <input type="text" id="title" name="title" required value="${v(post.title)}" />
                        </div>
                        <div class="form-group">
                            <label for="canonicalURL">Slug</label>
                            <input type="text" id="canonicalURL" name="canonicalURL" value="${v(post.slug || '')}" />
                        </div>
                    </div>

                    <!-- 2.1) 使用 MDX（支持 Img.astro） -->
                    <div class="form-group">
                      <label class="inline-flex items-center" style="gap:.5rem;">
                        <input type="checkbox" id="useMDX" ${isMDX ? 'checked' : ''} />
                        使用 MDX（支持在正文中直接写 &lt;Img /&gt;）
                      </label>
                    </div>

                    <!-- 3) 描述 -->
                    <div class="form-group">
                        <label for="description">描述 *</label>
                        <textarea id="description" name="description" class="gh-textarea">${v(post.description || '')}</textarea>
                    </div>

                    <!-- 4) 分类 / 标签 -->
                    <div class="form-row-2col">
                        <div class="form-group">
                            <label for="category">分类</label>
                            <select id="category" name="category">
                                <option value="technology" ${post.category === 'technology' ? 'selected' : ''}>技术</option>
                                <option value="life" ${post.category === 'life' ? 'selected' : ''}>生活</option>
                                <option value="sports" ${post.category === 'sports' ? 'selected' : ''}>运动</option>
                                <option value="startup" ${post.category === 'startup' ? 'selected' : ''}>创业</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="tags">标签（英文逗号分隔）</label>
                            <input type="text" id="tags" name="tags" value="${v(tags)}" />
                        </div>
                    </div>

                    <!-- 5) 其它开关 -->
                    <div class="form-group flags">
                        <label><input type="checkbox" id="featured" ${post.featured ? 'checked' : ''}/> 推荐</label>
                        <label><input type="checkbox" id="draft" ${post.draft ? 'checked' : ''}/> 草稿</label>
                    </div>

                    <!-- 6) OG 图 -->
                    <div class="form-group">
                        <label for="ogImage">OG 图片 URL（可选）</label>
                        <input type="text" id="ogImage" name="ogImage" value="${v(post.ogImage || '')}" />
                    </div>
                </form>
            </section>
        `;
    }

    // 新增：读取编辑表单
    readEditorForm() {
        const form = document.getElementById('editor-form');
        const get = (id) => form.querySelector(`#${id}`)?.value || '';
        return {
            title: get('title'),
            category: get('category'),
            description: get('description'),
            tags: get('tags'),
            featured: form.querySelector('#featured')?.checked || false,
            draft: form.querySelector('#draft')?.checked || false,
            ogImage: get('ogImage'),
            canonicalURL: get('canonicalURL'),
            timezone: get('timezone'),
            content: get('content')
        };
    }

    async savePost() {
        const postData = this.readEditorForm();
        try {
            let response;
            if (this.currentEditSlug) {
                response = await fetch(`${this.apiBase}/posts/${this.currentEditSlug}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            } else {
                response = await fetch(`${this.apiBase}/posts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                });
            }
            
            if (response.ok) {
                await this.loadPosts();
                history.pushState(null, '', '#/list');
                this.renderPosts();
                alert(this.currentEditSlug ? '文章更新成功！' : '文章创建成功！');
            } else {
                const error = await response.json();
                alert('保存失败: ' + error.error);
            }
        } catch (error) {
            alert('保存失败: ' + error.message);
        }
    }
    
    hideModal() {
        // 不再有模态框：返回列表
        history.pushState(null, '', '#/list');
        this.renderPosts();
    }
    
    openSettings() {
        // 这里先占位；后续可改为：打开设置模态框/跳转配置页等
        alert('设置面板开发中...');
    }
}

// 全局实例
const blogAdmin = new BlogAdmin();

// 全局函数（供 HTML 调用）
window.showCreateModal = () => blogAdmin.showCreateModal();
window.loadPosts = () => blogAdmin.loadPosts();
window.hideModal = () => blogAdmin.hideModal();