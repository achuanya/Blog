import { state, setCurrentEditSlug } from './state.js';
import { escapeHtml } from './utils.js';

export function renderEditorView(post, { onBack, onSave, onDelete }) {
  const container = document.getElementById('posts-container');
  container.innerHTML = buildEditorHTML(post);

  container.querySelector('#back-to-list')?.addEventListener('click', () => onBack?.());
  container.querySelector('#save-post')?.addEventListener('click', () => onSave?.());

  const delBtn = container.querySelector('#delete-post');
  if (delBtn) {
    delBtn.addEventListener('click', () => onDelete?.());
  }

  // Ctrl/Cmd+S
  container.querySelector('#editor-form')?.addEventListener('keydown', (ev) => {
    const isSave = (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's';
    if (isSave) { ev.preventDefault(); onSave?.(); }
  });

  // Markdown 预览 & 分屏
  const md = window.markdownit ? window.markdownit({ html: true, linkify: true, breaks: true }) : null;
  const editorBody = container.querySelector('#editor-body');
  const textarea = container.querySelector('#content');
  const previewPane = container.querySelector('#editor-preview');
  const previewEl = container.querySelector('#md-preview');
  const splitToggle = container.querySelector('#split-toggle');
  const tabs = container.querySelectorAll('.editor-tabs .tab');

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
      previewPane.style.display = (active === 'preview') ? '' : 'none';
    }
  };
  const renderPreview = () => {
    if (!md || !textarea || !previewEl) return;
    const raw = textarea.value || '';
    const transformed = transformImgAstroShortcode(raw);
    previewEl.innerHTML = md.render(transformed);
  };

  tabs.forEach(t => {
    t.addEventListener('click', () => {
      setActiveTab(t.getAttribute('data-tab'));
      updateLayout();
      renderPreview();
    });
  });
  splitToggle?.addEventListener('change', () => { updateLayout(); renderPreview(); });
  textarea?.addEventListener('input', () => renderPreview());
  updateLayout();
  renderPreview();

  // 插入 import
  container.querySelector('#insert-import')?.addEventListener('click', () => {
    const el = textarea; if (!el) return;
    const snippet = '\nimport Img from "@/components/Img.astro";\n';
    if (el.value.includes('import Img from "@/components/Img.astro"')) {
      alert('Import 语句已存在！'); return;
    }
    const lines = el.value.split('\n');
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) insertIndex = i + 1;
      else if (lines[i].trim() === '' && insertIndex > 0) break;
      else if (lines[i].trim() !== '' && !lines[i].trim().startsWith('import ')) break;
    }
    lines.splice(insertIndex, 0, snippet.trim());
    el.value = lines.join('\n');
    const newCursorPos = lines.slice(0, insertIndex + 1).join('\n').length;
    el.selectionStart = el.selectionEnd = newCursorPos;
    el.focus();
    requestAnimationFrame(renderPreview);
  });

  // 插入 Img
  container.querySelector('#insert-img-astro')?.addEventListener('click', () => {
    const el = textarea; if (!el) return;
    const snippet = '\n<Img src={`${IMAGES}/${frontmatter.slug}/`} alt="" exif={true} caption={true} />\n';
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + snippet + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + snippet.length;
    el.focus();
    requestAnimationFrame(renderPreview);
  });
}

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
    const slugInput = document.querySelector('#canonicalURL');
    const currentSlug = slugInput ? slugInput.value.trim() : '';
    let fullImageUrl = src;
    if (src && currentSlug && !src.startsWith('http')) {
      fullImageUrl = `https://cos.lhasa.icu/ArticlePictures/${currentSlug}/${src}`;
    }
    const imgHtml = `
<figure style="margin:1rem 0;text-align:center">
  <div style="position:relative;display:inline-block;max-width:100%">
    <img src="${escapeHtml(fullImageUrl)}" alt="${escapeHtml(alt)}" title="${escapeHtml(alt)}"
         style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)" />
    ${hasCaption ? `<figcaption style="margin-top:6px;font-size:12px;color:#6b7280">${escapeHtml(alt)}</figcaption>` : ``}
  </div>
</figure>`.trim();
    return imgHtml;
  });
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
  <div class="editor-view">
    <div class="editor-header">
      <button id="back-to-list" class="btn">返回列表</button>
      <div class="spacer"></div>
      ${!isNew ? '<button id="delete-post" class="btn btn-danger">删除</button>' : ''}
      <button id="save-post" class="btn btn-success">保存</button>
    </div>

    <form id="editor-form" class="editor-form">
      <div class="form-row-2col">
        <div class="form-group">
          <label>标题</label>
          <input id="title" type="text" value="${escapeHtml(title)}" />
        </div>
        <div class="form-group">
          <label>分类</label>
          <select id="category">
            <option value="technology" ${category==='technology'?'selected':''}>技术</option>
            <option value="life" ${category==='life'?'selected':''}>生活</option>
            <option value="sports" ${category==='sports'?'selected':''}>运动</option>
            <option value="startup" ${category==='startup'?'selected':''}>创业</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>描述</label>
        <textarea id="description" class="gh-textarea">${escapeHtml(description)}</textarea>
      </div>

      <div class="form-row-2col">
        <div class="form-group">
          <label>标签 (逗号分隔)</label>
          <input id="tags" type="text" value="${escapeHtml(tags)}" />
        </div>
        <div class="form-group">
          <label>OG 图片</label>
          <input id="ogImage" type="text" value="${escapeHtml(ogImage)}" />
        </div>
      </div>

      <div class="form-row-2col">
        <div class="form-group">
          <label>Slug（可编辑）</label>
          <input id="canonicalURL" type="text" value="${escapeHtml(slug)}" />
        </div>
        <div class="form-group">
          <label>时区</label>
          <input id="timezone" type="text" value="Asia/Shanghai" disabled />
        </div>
      </div>

      <div class="form-group flags">
        <label><input id="featured" type="checkbox" ${featured?'checked':''}/> 置顶</label>
        <label><input id="draft" type="checkbox" ${draft?'checked':''}/> 草稿</label>
        <label><input id="useMDX" type="checkbox" ${post?.filename?.endsWith('.mdx')?'checked':''}/> 使用 MDX</label>
      </div>

      <div class="editor-tabs">
        <span class="tab active" data-tab="write">Write</span>
        <span class="tab" data-tab="preview">Preview</span>
        <div class="spacer"></div>
        <label class="toggle"><input id="split-toggle" type="checkbox" /> Split View</label>
        <button id="insert-import" type="button" class="btn">+ import Img</button>
        <button id="insert-img-astro" type="button" class="btn">+ <Img /></button>
      </div>

      <div id="editor-body" class="editor-body">
        <div class="editor-pane">
          <textarea id="content" class="gh-editor" placeholder="在此编写 Markdown/MDX...">${escapeHtml(content)}</textarea>
        </div>
        <div id="editor-preview" class="editor-pane editor-preview" style="display:none">
          <div id="md-preview" class="md-preview"></div>
        </div>
      </div>
    </form>
  </div>`;
}