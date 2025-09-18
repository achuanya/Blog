/**
 * 分类标签组件控制器
 */
import componentLoader from './ComponentLoader.js';

class CategoryTabsComponent {
    constructor() {
        this.categories = [];
        this.activeCategory = 'all';
    }

    /**
     * 初始化分类标签组件
     * @param {HTMLElement} element - 组件根元素
     * @param {Object} props - 组件属性
     */
    async init(element, props = {}) {
        this.element = element;
        this.categories = props.categories || [];
        this.activeCategory = props.activeCategory || 'all';
        
        // 渲染标签
        this.render();
        
        // 绑定事件
        this.bindEvents();
    }

    /**
     * 渲染分类标签
     */
    render() {
        if (!this.element) return;

        const tabsContainer = this.element.querySelector('#category-tabs') || this.element;
        
        // 检查是否为移动端
        const isMobile = window.innerWidth < 768;
        
        // 构建标签HTML
        let tabsHTML = '';
        
        // 草稿标签置顶
        tabsHTML += `
            <button class="tab ${this.activeCategory === 'drafts' ? 'active' : ''}" 
                    data-category="drafts">
                草稿
            </button>
        `;
        
        // 移动端只显示草稿、新建和设置，PC端显示完整分类
        if (!isMobile) {
            // 添加"全部"标签
            tabsHTML += `
                <button class="tab ${this.activeCategory === 'all' ? 'active' : ''}" 
                        data-category="all">
                    全部
                </button>
            `;
            
            // 添加其他分类标签
            this.categories.forEach(category => {
                const isActive = this.activeCategory === category.slug || this.activeCategory === category.name;
                tabsHTML += `
                    <button class="tab ${isActive ? 'active' : ''}" 
                            data-category="${category.slug || category.name}">
                        ${category.displayName || category.name}
                    </button>
                `;
            });
        }
        
        // 添加间隔符
        tabsHTML += '<div class="spacer"></div>';
        
        // 添加新建按钮
        tabsHTML += `
            <a href="javascript:void(0)" class="nav-link" data-action="create">
                新建
            </a>
        `;
        
        // 添加设置按钮
        tabsHTML += `
            <a href="javascript:void(0)" class="nav-link" data-action="settings">
                设置
            </a>
        `;
        
        // 移动端不显示搜索图标
        if (!isMobile) {
            tabsHTML += `
                <div class="search-icon" aria-label="Search">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                        <path d="M21 21l-6 -6" />
                    </svg>
                </div>
            `;
        }
        
        tabsContainer.innerHTML = tabsHTML;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        if (!this.element) return;

        // 标签点击事件
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab')) {
                const category = e.target.dataset.category;
                this.setActiveCategory(category);
            } else if (e.target.classList.contains('nav-link')) {
                const action = e.target.dataset.action;
                this.handleActionClick(action);
            } else if (e.target.closest('.search-icon')) {
                this.handleSearchClick();
            }
        });
        
        // 监听窗口大小变化，自动重新渲染
        if (!this._resizeListener) {
            this._resizeListener = () => {
                // 防抖处理
                clearTimeout(this._resizeTimeout);
                this._resizeTimeout = setTimeout(() => {
                    this.render();
                }, 100);
            };
            window.addEventListener('resize', this._resizeListener);
        }
    }

    /**
     * 设置活跃分类
     * @param {string} category - 分类标识
     */
    setActiveCategory(category) {
        if (this.activeCategory === category) return;

        const previousCategory = this.activeCategory;
        this.activeCategory = category;

        // 更新UI状态
        this.updateActiveState();

        // 触发分类变更事件
        const event = new CustomEvent('category-change', {
            detail: { 
                category, 
                previousCategory,
                categoryData: this.getCategoryData(category)
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 更新活跃状态
     */
    updateActiveState() {
        if (!this.element) return;

        const tabs = this.element.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const category = tab.dataset.category;
            if (category === this.activeCategory) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    /**
     * 获取分类数据
     * @param {string} categorySlug - 分类标识
     * @returns {Object|null} 分类数据
     */
    getCategoryData(categorySlug) {
        if (categorySlug === 'all') {
            return { slug: 'all', name: '全部' };
        }
        return this.categories.find(cat => cat.slug === categorySlug) || null;
    }

    /**
     * 更新分类列表
     * @param {Array} categories - 新的分类列表
     */
    updateCategories(categories) {
        this.categories = categories;
        this.render();
        this.bindEvents();
    }

    /**
     * 添加分类
     * @param {Object} category - 分类对象 {slug, name}
     */
    addCategory(category) {
        if (!this.categories.find(cat => cat.slug === category.slug)) {
            this.categories.push(category);
            this.render();
            this.bindEvents();
        }
    }

    /**
     * 移除分类
     * @param {string} categorySlug - 分类标识
     */
    removeCategory(categorySlug) {
        this.categories = this.categories.filter(cat => cat.slug !== categorySlug);
        
        // 如果移除的是当前活跃分类，切换到"全部"
        if (this.activeCategory === categorySlug) {
            this.activeCategory = 'all';
        }
        
        this.render();
        this.bindEvents();
    }

    /**
     * 获取当前活跃分类
     * @returns {string} 当前分类标识
     */
    getActiveCategory() {
        return this.activeCategory;
    }

    /**
     * 获取所有分类
     * @returns {Array} 分类列表
     */
    getCategories() {
        return [...this.categories];
    }
    
    /**
     * 处理操作按钮点击
     * @param {string} action - 操作类型
     */
    handleActionClick(action) {
        const event = new CustomEvent('category-action', {
            detail: { action }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 处理搜索点击
     */
    handleSearchClick() {
        const event = new CustomEvent('category-search', {
            detail: {}
        });
        document.dispatchEvent(event);
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 清理窗口大小变化监听器
        if (this._resizeListener) {
            window.removeEventListener('resize', this._resizeListener);
            this._resizeListener = null;
        }
        
        // 清理定时器
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = null;
        }
        
        if (this.element) {
            this.element.innerHTML = '';
        }
    }
}

// 注册分类标签组件
componentLoader.register(
    'category-tabs',
    'src/components/CategoryTabs.html',
    async (element, props) => {
        const categoryTabs = new CategoryTabsComponent();
        await categoryTabs.init(element, props);
        
        // 将实例存储到元素上，便于外部访问
        element._categoryTabsInstance = categoryTabs;
        
        return categoryTabs;
    }
);

export default CategoryTabsComponent;
export { CategoryTabsComponent };