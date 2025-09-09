/**
 * 页面布局组件控制器
 */
import componentLoader from './ComponentLoader.js';
import './Navigation.js';
import './CategoryTabs.js';

class LayoutComponent {
    constructor() {
        this.navigationInstance = null;
        this.categoryTabsInstance = null;
        this.isInitialized = false;
    }

    /**
     * 初始化布局组件
     * @param {HTMLElement} element - 组件根元素
     * @param {Object} props - 组件属性
     */
    async init(element, props = {}) {
        this.element = element;
        this.props = props;
        
        // 渲染子组件
        await this.renderSubComponents();
        
        // 绑定事件
        this.bindEvents();
        
        this.isInitialized = true;
    }

    /**
     * 渲染子组件
     */
    async renderSubComponents() {
        if (!this.element) return;

        try {
            // 渲染导航组件
            const navigationContainer = this.element.querySelector('#navigation-container');
            if (navigationContainer) {
                const navElement = await componentLoader.render(
                    'navigation', 
                    navigationContainer,
                    {
                        activeNav: this.props.activeNav || 'drafts'
                    }
                );
                this.navigationInstance = navElement._navigationInstance;
            }

            // 渲染分类标签组件
            const categoryTabsContainer = this.element.querySelector('#category-tabs-container');
            if (categoryTabsContainer) {
                const tabsElement = await componentLoader.render(
                    'category-tabs',
                    categoryTabsContainer,
                    {
                        categories: this.props.categories || [],
                        activeCategory: this.props.activeCategory || 'all'
                    }
                );
                this.categoryTabsInstance = tabsElement._categoryTabsInstance;
            }

        } catch (error) {
            console.error('Error rendering sub-components:', error);
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 监听导航变更事件
        document.addEventListener('navigation-change', (e) => {
            this.handleNavigationChange(e.detail);
        });

        // 监听分类变更事件
        document.addEventListener('category-change', (e) => {
            this.handleCategoryChange(e.detail);
        });
        
        // 监听分类操作事件
        document.addEventListener('category-action', (e) => {
            this.handleCategoryAction(e.detail);
        });
        
        // 监听分类搜索事件
        document.addEventListener('category-search', (e) => {
            this.handleCategorySearch(e.detail);
        });

        // 监听菜单切换事件
        document.addEventListener('menu-toggle', (e) => {
            this.handleMenuToggle(e.detail);
        });
    }

    /**
     * 处理导航变更
     * @param {Object} detail - 事件详情
     */
    handleNavigationChange(detail) {
        const { navType, previousNav } = detail;
        
        // 触发布局级别的导航变更事件
        const event = new CustomEvent('layout-navigation-change', {
            detail: { navType, previousNav, layout: this }
        });
        document.dispatchEvent(event);
    }

    /**
     * 处理分类变更
     * @param {Object} detail - 事件详情
     */
    handleCategoryChange(detail) {
        const { category, previousCategory, categoryData } = detail;
        
        // 触发布局级别的分类变更事件
        const event = new CustomEvent('layout-category-change', {
            detail: { category, previousCategory, categoryData, layout: this }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 处理分类操作
     * @param {Object} detail - 事件详情
     */
    handleCategoryAction(detail) {
        const { action } = detail;
        
        // 触发布局级别的分类操作事件
        const event = new CustomEvent('layout-category-action', {
            detail: { action, layout: this }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 处理分类搜索
     * @param {Object} detail - 事件详情
     */
    handleCategorySearch(detail) {
        // 触发布局级别的搜索事件
        const event = new CustomEvent('layout-category-search', {
            detail: { layout: this }
        });
        document.dispatchEvent(event);
    }

    /**
     * 处理菜单切换
     * @param {Object} detail - 事件详情
     */
    handleMenuToggle(detail) {
        const { isOpen } = detail;
        
        // 可以在这里添加布局相关的菜单切换逻辑
        if (isOpen) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }
    }

    /**
     * 更新主内容
     * @param {string|HTMLElement} content - 内容
     */
    updateMainContent(content) {
        const mainContent = this.element?.querySelector('#main-content');
        if (mainContent) {
            if (typeof content === 'string') {
                mainContent.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                mainContent.innerHTML = '';
                mainContent.appendChild(content);
            }
        }
    }

    /**
     * 获取导航实例
     * @returns {NavigationComponent|null}
     */
    getNavigationInstance() {
        return this.navigationInstance;
    }

    /**
     * 获取分类标签实例
     * @returns {CategoryTabsComponent|null}
     */
    getCategoryTabsInstance() {
        return this.categoryTabsInstance;
    }

    /**
     * 设置导航状态
     * @param {string} navType - 导航类型
     */
    setNavigation(navType) {
        if (this.navigationInstance) {
            this.navigationInstance.setNav(navType);
        }
    }

    /**
     * 设置分类状态
     * @param {string} category - 分类标识
     */
    setCategory(category) {
        if (this.categoryTabsInstance) {
            this.categoryTabsInstance.setActiveCategory(category);
        }
    }

    /**
     * 更新分类列表
     * @param {Array} categories - 分类列表
     */
    updateCategories(categories) {
        if (this.categoryTabsInstance) {
            this.categoryTabsInstance.updateCategories(categories);
        }
    }

    /**
     * 显示/隐藏分类标签
     * @param {boolean} visible - 是否显示
     */
    setCategoryTabsVisible(visible) {
        const container = this.element?.querySelector('#category-tabs-container');
        if (container) {
            container.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * 显示/隐藏导航
     * @param {boolean} visible - 是否显示
     */
    setNavigationVisible(visible) {
        const container = this.element?.querySelector('#navigation-container');
        if (container) {
            container.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * 获取当前状态
     * @returns {Object} 当前状态
     */
    getCurrentState() {
        return {
            navigation: this.navigationInstance?.getCurrentNav(),
            category: this.categoryTabsInstance?.getActiveCategory(),
            categories: this.categoryTabsInstance?.getCategories()
        };
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 销毁子组件
        if (this.navigationInstance) {
            this.navigationInstance.destroy();
        }
        if (this.categoryTabsInstance) {
            this.categoryTabsInstance.destroy();
        }

        // 移除事件监听器
        document.removeEventListener('navigation-change', this.handleNavigationChange);
        document.removeEventListener('category-change', this.handleCategoryChange);
        document.removeEventListener('menu-toggle', this.handleMenuToggle);

        this.isInitialized = false;
    }
}

// 注册布局组件
componentLoader.register(
    'layout',
    'src/components/Layout.html',
    async (element, props) => {
        const layout = new LayoutComponent();
        await layout.init(element, props);
        
        // 将实例存储到元素上，便于外部访问
        element._layoutInstance = layout;
        
        return layout;
    }
);

export default LayoutComponent;
export { LayoutComponent };