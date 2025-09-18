import { state, setCurrentEditSlug } from './state.js';
import { escapeHtml } from './utils.js';

export function renderEditorView(post, { onBack, onSave, onDelete }) {
  const container = document.getElementById('posts-container');
  container.innerHTML = buildEditorHTML(post);

  // 顶部栏交互
  // 根据当前是否在配置视图，动态决定返回行为
  const root = container.querySelector('#me-root');
  const backBtn = container.querySelector('#me-back');
  const updateBackBehavior = () => {
  if (!backBtn) return;
  const inMeta = root?.classList.contains('meta-view');
  backBtn.setAttribute('title', inMeta ? '返回编辑' : '返回');
  backBtn.setAttribute('aria-label', inMeta ? '返回编辑' : '返回');
  };
  updateBackBehavior();
  
  backBtn?.addEventListener('click', () => {
  if (root?.classList.contains('meta-view')) {
  // 在配置界面时，返回到编辑界面
  root.classList.remove('meta-view');
  updateBackBehavior();
  } else {
  // 否则返回文章列表
  onBack?.();
  }
  });

  // 绑定配置面板保存按钮
  container.querySelector('#me-save-meta')?.addEventListener('click', () => {
    syncMetaFields();
    ensureDescriptionFilled();
    // 保存成功后清除自动保存数据
    clearAutoSave();
    onSave?.();
  });

  // 同步配置界面字段到隐藏字段
  const syncMetaFields = () => {
    const titleMeta = container.querySelector('#title-meta');
    const titleHidden = container.querySelector('#title');
    if (titleMeta && titleHidden) {
      titleHidden.value = titleMeta.value;
    }
  };

  // 监听标题字段变化，实时同步
  container.querySelector('#title-meta')?.addEventListener('input', () => {
    syncMetaFields();
    // 标题变化时也重置自动保存计时
    lastSaveTime = Date.now();
  });
  // container.querySelector('#me-next')?.addEventListener('click', () => {
  // 改为：切换到配置界面视图（隐藏编辑器，显示配置项）
  // const root = container.querySelector('#me-root');
  // root?.classList.add('meta-view');
  // })
  container.querySelector('#me-next')?.addEventListener('click', () => {
  // 切换到配置界面视图：保留顶部栏，并将 me-meta-panel 移入 .mobile-editor 作为子级
  const mobile = root?.querySelector('.mobile-editor');
  const panel = root?.querySelector('#me-meta-panel');
  if (mobile && panel && panel.parentElement !== mobile) {
  mobile.appendChild(panel);
  }
  root?.classList.add('meta-view');
  updateBackBehavior();
  });
  // container.querySelector('#me-meta-close')?.addEventListener('click', () => {
  // 从配置界面返回编辑器
  // const root = container.querySelector('#me-root');
  // root?.classList.remove('meta-view');
  // })
  container.querySelector('#me-meta-delete')?.addEventListener('click', () => {
    // 删除文章功能
    if (confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      onDelete?.();
    }
  });

  // ===== 封面上传/预览：仿微信素材风格 =====
  const coverBox = container.querySelector('#me-cover');
  const ogInput = container.querySelector('#ogImage-meta');
  const updateCoverUI = () => {
    const url = (ogInput?.value || '').trim();
    if (!coverBox) return;
    if (url) {
      coverBox.classList.add('has-img');
      coverBox.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;;
    } else {
      coverBox.classList.remove('has-img');
      coverBox.style.backgroundImage = '';
    }
  };
  updateCoverUI();
  coverBox?.addEventListener('click', () => {
    const current = (ogInput?.value || '').trim();
    const val = prompt('请输入封面图 URL（留空则移除）', current);
    if (val === null) return;
    if (ogInput) ogInput.value = val.trim();
    updateCoverUI();
  });

  // 表单阻止默认提交
  container.querySelector('#editor-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    syncMetaFields();
    ensureDescriptionFilled();
    // 保存成功后清除自动保存数据
    clearAutoSave();
    onSave?.();
  });

  // Ctrl/Cmd+S 快捷保存
  container.querySelector('#editor-form')?.addEventListener('keydown', (ev) => {
    const isSave = (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's';
    if (isSave) { 
      ev.preventDefault(); 
      syncMetaFields(); 
      ensureDescriptionFilled(); 
      // 保存成功后清除自动保存数据
      clearAutoSave();
      onSave?.(); 
    }
  });

  // ====== 自动保存功能 ======
  let autoSaveTimer = null;
  let lastSaveTime = Date.now();
  const AUTOSAVE_INTERVAL = 5000; // 5秒自动保存
  const AUTOSAVE_KEY_PREFIX = 'blog_autosave_';
  
  // 获取当前文章的自动保存键
  const getAutoSaveKey = () => {
    const slug = post?.slug || 'new_post';
    return `${AUTOSAVE_KEY_PREFIX}${slug}`;
  };
  
  // 保存到localStorage
  const saveToLocalStorage = () => {
    if (!simpleMDE) return;
    
    const autoSaveData = {
      title: titleInput?.value || '',
      content: simpleMDE.value(),
      timestamp: Date.now(),
      slug: post?.slug || 'new_post'
    };
    
    try {
      localStorage.setItem(getAutoSaveKey(), JSON.stringify(autoSaveData));
      lastSaveTime = Date.now();
      updateAutoSaveStatus('已自动保存');
    } catch (error) {
      console.warn('自动保存失败:', error);
      updateAutoSaveStatus('保存失败');
    }
  };
  
  // 从localStorage恢复内容
  const restoreFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(getAutoSaveKey());
      if (!saved) return null;
      
      const data = JSON.parse(saved);
      // 检查是否是最近的保存（24小时内）
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(getAutoSaveKey());
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('恢复自动保存失败:', error);
      return null;
    }
  };
  
  // 清除自动保存数据
  const clearAutoSave = () => {
    localStorage.removeItem(getAutoSaveKey());
    // 同时清除拒绝标记
    sessionStorage.removeItem(`${getAutoSaveKey()}_rejected`);
    updateAutoSaveStatus('');
  };
  
  // 更新自动保存状态显示
  const updateAutoSaveStatus = (message) => {
    let statusEl = container.querySelector('#autosave-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'autosave-status';
      statusEl.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
      `;
      document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    if (message) {
      statusEl.style.opacity = '1';
      setTimeout(() => {
        statusEl.style.opacity = '0';
      }, 2000);
    } else {
      statusEl.style.opacity = '0';
    }
  };
  
  // 启动自动保存定时器
  const startAutoSave = () => {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(() => {
      if (simpleMDE && Date.now() - lastSaveTime > AUTOSAVE_INTERVAL) {
        saveToLocalStorage();
      }
    }, AUTOSAVE_INTERVAL);
  };
  
  // 停止自动保存
  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  };

  // ====== SimpleMDE 初始化 ======
  let simpleMDE = null;
  const editorContainer = container.querySelector('#content');
  const titleInput = container.querySelector('#title-meta');
  const descInput = container.querySelector('#description');

  // 初始化 SimpleMDE
  const initSimpleMDE = () => {
    if (typeof SimpleMDE === 'undefined') {
      console.error('SimpleMDE not found');
      return;
    }

    if (simpleMDE) {
      simpleMDE.toTextArea();
      simpleMDE = null;
    }

    // 创建textarea元素
    const textarea = document.createElement('textarea');
    textarea.value = post?.content || '';
    editorContainer.innerHTML = '';
    editorContainer.appendChild(textarea);

    simpleMDE = new SimpleMDE({
      element: textarea,
      spellChecker: false,
      status: false,
      toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'image', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide'
      ],
      placeholder: '开始编写你的文章...',
      autofocus: false,
      tabSize: 2,
      indentWithTabs: false,
      lineWrapping: true,
      styleSelectedText: false
    });

    // 监听内容变化
    simpleMDE.codemirror.on('change', () => {
      ensureDescriptionFilled();
      // 内容变化时重置自动保存计时
      lastSaveTime = Date.now();
    });
    
    // 检查是否有自动保存的内容需要恢复
    const savedData = restoreFromLocalStorage();
    if (savedData && savedData.content && savedData.content !== (post?.content || '')) {
      const shouldRestore = confirm(
        `检测到未保存的内容（${new Date(savedData.timestamp).toLocaleString()}），是否恢复？`
      );
      if (shouldRestore) {
        simpleMDE.value(savedData.content);
        if (titleInput && savedData.title) {
          titleInput.value = savedData.title;
        }
        updateAutoSaveStatus('已恢复自动保存内容');
      } else {
        // 用户选择不恢复，清除自动保存数据并标记用户已拒绝恢复
        clearAutoSave();
        // 设置一个标记，表示用户已经拒绝了恢复，避免页面卸载时重新保存
        sessionStorage.setItem(`${getAutoSaveKey()}_rejected`, 'true');
      }
    }
    
    // 启动自动保存
    startAutoSave();

    // 添加快捷键支持
    simpleMDE.codemirror.setOption('extraKeys', {
      'Ctrl-S': () => {
        syncMetaFields();
        ensureDescriptionFilled();
        onSave?.();
      },
      'Cmd-S': () => {
        syncMetaFields();
        ensureDescriptionFilled();
        onSave?.();
      }
    });
  };

  // 延迟初始化 SimpleMDE
  setTimeout(initSimpleMDE, 100);



  const ensureDescriptionFilled = () => {
    const raw = simpleMDE ? simpleMDE.value() : '';
    const firstLine = raw.trim().split(/\n+/).find(Boolean) || '';
    const summary = firstLine || raw.slice(0, 140).replace(/\s+/g, ' ').trim();
    if (descInput) descInput.value = summary || '暂无描述';
  };

  // SimpleMDE 已在初始化时添加了内容变化监听

  // 添加获取编辑器内容的方法
  window.getEditorContent = () => {
    return simpleMDE ? simpleMDE.value() : '';
  };

  // 页面卸载前的保存提醒
  const handleBeforeUnload = (event) => {
    if (simpleMDE) {
      // 检查用户是否已经拒绝过恢复，如果是则不再自动保存
      const hasRejected = sessionStorage.getItem(`${getAutoSaveKey()}_rejected`) === 'true';
      
      // 检查是否有未保存的更改
      const currentContent = simpleMDE.value();
      const currentTitle = titleInput?.value || '';
      const originalContent = post?.content || '';
      const originalTitle = post?.title || '';
      
      const hasChanges = currentContent !== originalContent || currentTitle !== originalTitle;
      
      // 只有在有更改且用户没有拒绝过恢复的情况下才自动保存
      if (hasChanges && !hasRejected) {
        saveToLocalStorage();
        const message = '您有未保存的更改，确定要离开吗？内容已自动保存到本地。';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    }
  };
  
  // 添加页面卸载监听
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // 清理函数
  window.disposeSimpleMDE = () => {
    // 停止自动保存
    stopAutoSave();
    
    // 移除页面卸载监听
    window.removeEventListener('beforeunload', handleBeforeUnload);
    
    // 清理SimpleMDE
    if (simpleMDE) {
      simpleMDE.toTextArea();
      simpleMDE = null;
    }
    
    // 清理状态显示元素
    const statusEl = document.querySelector('#autosave-status');
    if (statusEl) {
      statusEl.remove();
    }
  };

  // 删除按钮（当存在旧文章时显示）
  const delBtn = container.querySelector('#delete-post');
  if (delBtn) {
    delBtn.addEventListener('click', () => onDelete?.());
  }
}

function buildEditorHTML(post) {
  const isNew = !post?.slug;
  const title = post?.title || '';
  const category = post?.category || 'technology';
  const description = post?.description || '';
  const tags = Array.isArray(post?.tags) ? post.tags.join(', ') : '';
  const featured = !!post?.featured;
  const draft = !!post?.draft;
  const ogImage = post?.ogImage || '';
  const slug = post?.slug || '';
  const content = post?.content || '';

  return `
  <style>
    /* 简洁移动编辑器样式（只作用当前视图） */
    .mobile-editor { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,.06); }
    .me-topbar { display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid #eef2f7; }
    .me-topbar .icon-btn, .me-topbar .text-btn { height:32px; display:inline-flex; align-items:center; justify-content:center; gap:4px; border-radius:6px; color:#000; text-decoration:none; padding:6px 8px; border:none; background:transparent; cursor:pointer; font-size:14px; min-width:auto; }
    .me-topbar .icon-btn:hover, .me-topbar .text-btn:hover { color:#666; }
    .me-topbar .spacer { flex:1; }
    .me-topbar .text-btn[aria-disabled="true"] { color:#94a3b8; cursor:default; }
    .me-topbar .icon-btn svg, .me-topbar .text-btn svg { width:16px; height:16px; flex-shrink:0; }
    .me-topbar .icon-btn span, .me-topbar .text-btn span { font-size:14px; line-height:1; }

    /* 隐藏滚动条（跨浏览器） */
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    /* 直接作用于编辑相关容器，确保编辑模式下均隐藏 */
    #posts-container, .mobile-editor, .me-editor, .me-content { -ms-overflow-style:none; scrollbar-width:none; }
    #posts-container::-webkit-scrollbar, .mobile-editor::-webkit-scrollbar, .me-editor::-webkit-scrollbar, .me-content::-webkit-scrollbar { display:none; }

    .me-editor { display:flex; flex-direction:column; min-height:0; }
    .me-title { width:100%; border:0; outline:none; font-size:22px; font-weight:600; color:#0f172a; padding:0px 0 20px 0;; }
    .me-title::placeholder { color:#94a3b8; }
    .me-content { width:100%; flex:1 1 auto; min-height:0; border:0; outline:none; padding:0; resize:none; font-size:16px; line-height:1.75; color:#0f172a; overflow:hidden; position:relative; }
    .me-content .CodeMirror { border:0; height:auto; min-height:300px; font-size:16px; line-height:1.75; }
    .me-content .CodeMirror-scroll { min-height:300px; }
    /* SimpleMDE 工具栏置顶样式 */
    .me-content .editor-toolbar { 
      border:0; 
      background:#fff; 
      position: sticky !important;
      top: 0 !important;
      z-index: 1000 !important;
    }
    .me-content .editor-toolbar a { color:#64748b !important; }
    .me-content .editor-toolbar a:hover { background:#e2e8f0 !important; color:#0f172a !important; }
    
    /* Fullscreen 模式下的工具栏样式修复 */
    .me-content .editor-toolbar.fullscreen { 
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 9999 !important;
      width: 100% !important;
    }
    
    /* Side-by-Side 模式下的工具栏样式修复 */
    .editor-side-by-side .editor-toolbar {
      position: sticky !important;
      top: 0 !important;
      z-index: 1001 !important;
    }
    
    /* CodeMirror Fullscreen 模式样式 */
    .me-content .CodeMirror.CodeMirror-fullscreen { 
      z-index: 9998 !important;
    }
    
    /* Side-by-Side 模式下的 CodeMirror 样式修复 */
    .editor-side-by-side .CodeMirror {
      padding-top: 0 !important;
    }
    
    /* 修复 Side-by-Side 模式下的预览区域 */
    .editor-side-by-side .editor-preview-side {
      top: 50px !important; /* 为置顶工具栏留出空间 */
    }

    /* 元信息面板（默认作为弹层定义） */
    .me-meta-panel { position:fixed; inset:0; background:rgba(0,0,0,.25); display:none; align-items:flex-end; z-index:50; opacity:0; transition:opacity .2s ease; }
    .me-meta-panel.open { display:flex; opacity:1; }
    .me-meta-sheet { width:100%; background:#fff; border-radius:16px 16px 0 0; padding:14px; max-height:80vh; overflow:auto; -webkit-overflow-scrolling:touch; }
    .me-meta-row { display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:10px; }
    .me-meta-row label { display:block; font-weight:600; margin-bottom:6px; color:#0f172a; }
    .me-meta-row input, .me-meta-row select, .me-meta-row textarea { width:100%; border:1px solid #e2e8f0; border-radius:8px; padding:8px; font-size:14px; }
    .me-meta-actions { display:flex; justify-content:flex-end; gap:8px; padding-top:6px; }
    .btn { display:inline-block; background:#01c676; color:#fff; border:none; border-radius:8px; padding:8px 25px; cursor:pointer; }
    .btn-outline { background:#e6eae9; color:#000; }

    /* 视图容器，用于在"下一步"时切换到配置界面（非弹窗） */
    #me-root { position:relative; }
    #me-root .mobile-editor { transition: opacity .2s ease; }
    /* 在配置视图下保留顶部栏，仅隐藏编辑表单与工具栏 */
    #me-root.meta-view .me-editor { display:none; }

    #me-root.meta-view #me-next { display:none; }
    #me-root.meta-view .me-meta-panel { position:static; inset:auto; background:transparent; display:block; opacity:1; }
    #me-root.meta-view .me-meta-sheet { border-radius:12px; max-height:none; height:auto; min-height:60vh; }

    /* 新增：在配置界面将操作区贴紧底部，设定高度与背景色 */
    #me-root.meta-view .me-meta-sheet { display:flex; flex-direction:column; overflow:auto; -webkit-overflow-scrolling:touch; }
    #me-root.meta-view .me-meta-actions { position: fixed; bottom: 0; left: 0; width: 100%; padding: 16px 12px; background-color: #f2f6f5; border-top: 1px solid #eef2f7; z-index: 60; }

    /* ===== 仿微信风格：封面 / 列表单元 / 开关 ===== */
    .meta-cover { margin-bottom:12px; }
    .cover-uploader { height:170px; border:1px dashed #e5e7eb; border-radius:10px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#94a3b8; cursor:pointer; position:relative; overflow:hidden; }
    .cover-uploader .placeholder { display:flex; flex-direction:column; align-items:center; gap:6px; pointer-events:none; }
    .cover-uploader .placeholder .plus { font-size:28px; line-height:1; }
    .cover-uploader.has-img { border:none; background-size:cover; background-position:center; color:transparent; }
    .cover-uploader.has-img .placeholder { display:none; }

    .form-list { background:#fff; border:1px solid #eef2f7; border-radius:12px; overflow:hidden; }
    .form-cell { display:flex; align-items:center; gap:10px; padding:12px 12px; border-bottom:1px solid #eef2f7; background-color: #f5f9fa; }
    .form-cell:last-child { border-bottom:none; }
    .form-cell label { flex:0 0 86px; color:#0f172a; font-weight:600; }
    .form-cell .control { flex:1 1 auto; }
    .form-cell input[type="text"], .form-cell select { width:100%; border:0; outline:none; background:transparent; font-size:14px; color:#0f172a; }

    .meta-block { margin-top:12px; }
    .meta-block .block-title { font-weight:600; color:#0f172a; margin:10px 0 6px; }
    .desc-input { width:100%; min-height:100px; border:1px solid #e5e7eb; border-radius:10px; padding:10px; font-size:14px; }

    .switch { position:relative; display:inline-block; width:44px; height:26px; }
    .switch input { display:none; }
    .switch .slider { position:absolute; inset:0; background:#98989a; border-radius:999px; transition:.2s; }
    .switch .slider::before { content:""; position:absolute; width:20px; height:20px; left:3px; top:3px; background:#fff; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,.2); transition:.2s; }
    .switch input:checked + .slider { background:#01c676; }
    .switch input:checked + .slider::before { transform:translateX(18px); }

    /* ===== Desktop fixes: keep toolbar at the bottom and textarea fills above it ===== */
    @media (min-width: 768px) {
      /* 让编辑视图占满可视高度 */
      #me-root { min-height: 100vh; display: flex; }
      #me-root .mobile-editor { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }
      #me-root .me-editor { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }
      #me-root .me-content { flex: 1 1 auto; min-height: 0; overflow: auto; }

      /* 配置界面宽度与 .main-card 保持一致（仅桌面端） */
      #me-root.meta-view .me-meta-sheet { width: 768px !important; max-width: none; margin-left: auto; margin-right: auto; }
      /* 让底部操作条与面板同宽（768px），并水平居中 */
      #me-root.meta-view .me-meta-actions { left: 50%; transform: translateX(-50%); width: 768px !important; padding-left: 14px; padding-right: 14px; }
    }
  </style>

  <div id="me-root" class="me-root" role="group" aria-label="文章编辑与配置">
    <div class="mobile-editor" role="region" aria-label="编辑器">
      <div class="me-topbar">
        <button id="me-back" class="icon-btn" title="Previous" aria-label="Previous">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M15 6l-6 6l6 6" />
          </svg>
          <span>Previous</span>
        </button>
        <div class="spacer"></div>
        <span id="me-next" class="text-btn" role="button" aria-disabled="false">
          <span>Next</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M9 6l6 6l-6 6" />
          </svg>
        </span>
      </div>

      <form id="editor-form" class="me-editor">
        <div id="content" class="me-content no-scrollbar"></div>

        <!-- 隐藏/默认字段，保持与保存逻辑兼容 -->
        <input id="title" type="hidden" value="${escapeHtml(title)}" />
        <input id="description" type="hidden" value="${escapeHtml(description)}" />
        <select id="category" style="display:none">
          <option value="technology" ${category==='technology'?'selected':''}>技术</option>
          <option value="life" ${category==='life'?'selected':''}>生活</option>
          <option value="sports" ${category==='sports'?'selected':''}>运动</option>
          <option value="startup" ${category==='startup'?'selected':''}>创业</option>
        </select>
        <input id="tags" type="hidden" value="${escapeHtml(tags)}" />
        <input id="ogImage" type="hidden" value="${escapeHtml(ogImage)}" />
        <input id="canonicalURL" type="hidden" value="${escapeHtml(slug)}" />
        <input id="timezone" type="hidden" value="Asia/Shanghai" />
        <input id="featured" type="checkbox" style="display:none" ${featured?'checked':''} />
        <input id="draft" type="checkbox" style="display:none" ${draft?'checked':''} />
        <input id="useMDX" type="checkbox" style="display:none" ${post?.filename?.endsWith?.('.mdx')?'checked':''} />
      </form>

      <!-- 配置界面（移动为 mobile-editor 的子级，保留顶部栏） -->
      <div id="me-meta-panel" class="me-meta-panel" aria-hidden="true">
        <div class="me-meta-sheet" role="dialog" aria-modal="true" aria-label="文章设置">
          <!-- 列表单元：基本信息 -->
          <div class="form-list">
            <div class="form-cell">
              <label>标题</label>
              <div class="control"><input id="title-meta" type="text" value="${escapeHtml(title)}" placeholder="输入标题" /></div>
            </div>
            <div class="form-cell">
              <label>Slug</label>
              <div class="control"><input id="canonicalURL-meta" type="text" value="${escapeHtml(slug)}" placeholder="唯一ID" /></div>
            </div>
            <div class="form-cell">
              <label>分类</label>
              <div class="control">
                <select id="category-meta">
                  <option value="technology" ${category==='technology'?'selected':''}>技术</option>
                  <option value="life" ${category==='life'?'selected':''}>生活</option>
                  <option value="sports" ${category==='sports'?'selected':''}>运动</option>
                  <option value="startup" ${category==='startup'?'selected':''}>创业</option>
                </select>
              </div>
            </div>
            <!-- 封面：移动到分类下方 -->
            <div class="form-cell">
              <label>封面</label>
              <div class="control"><input id="ogImage-meta" type="text" value="${escapeHtml(ogImage)}" placeholder="是封面也是OG" /></div>
            </div>
            <div class="form-cell">
              <label>标签</label>
              <div class="control"><input id="tags-meta" type="text" value="${escapeHtml(tags)}" placeholder="英文逗号分隔" /></div>
            </div>
          </div>

          <!-- 描述 -->
          <div class="meta-block">
            <textarea id="description-meta" class="desc-input" placeholder="描述...">${escapeHtml(description)}</textarea>
          </div>

          <!-- 更多设置 -->
          <div class="meta-block">
            <div class="form-list">
              <div class="form-cell">
                <label>置顶</label>
                <div class="control">
                  <label class="switch">
                    <input id="featured-meta" type="checkbox" ${featured?'checked':''} />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <div class="form-cell">
                <label>草稿</label>
                <div class="control">
                  <label class="switch">
                    <input id="draft-meta" type="checkbox" ${draft?'checked':''} />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <div class="form-cell">
                <label>MDX</label>
                <div class="control">
                  <label class="switch">
                    <input id="useMDX-meta" type="checkbox" ${post?.filename?.endsWith?.('.mdx')?'checked':''} />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="me-meta-actions">
            <button id="me-meta-delete" type="button" class="btn btn-outline" style="color:#000;">删除</button>
            <button id="me-save-meta" type="button" class="btn">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;
}