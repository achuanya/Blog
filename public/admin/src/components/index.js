/**
 * 组件管理器 - 统一导出和管理所有组件
 */
import componentLoader from './ComponentLoader.js';
import NavigationComponent from './Navigation.js';
import CategoryTabsComponent from './CategoryTabs.js';
import LayoutComponent from './Layout.js';

/**
 * 组件管理器类
 */
class ComponentManager {
    constructor() {
        this.loader = componentLoader;
        this.components = new Map();
        this.initialized = false;
    }

    /**
     * 初始化所有组件
     */
    async init() {
        if (this.initialized) {
            console.warn('ComponentManager already initialized');
            return;
        }

        try {
            // 组件已经在各自的模块中注册到 componentLoader
            // 这里只需要确保所有模块都被加载
            console.log('Components registered:', {
                navigation: this.loader.components.has('navigation'),
                categoryTabs: this.loader.components.has('category-tabs'),
                layout: this.loader.components.has('layout')
            });

            this.initialized = true;
            console.log('ComponentManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ComponentManager:', error);
            throw error;
        }
    }

    /**
     * 渲染组件
     * @param {string} componentName - 组件名称
     * @param {HTMLElement|string} container - 容器
     * @param {Object} props - 属性
     * @returns {Promise<HTMLElement>} 组件元素
     */
    async render(componentName, container, props = {}) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            const element = await this.loader.render(componentName, container, props);
            
            // 存储组件实例引用
            const instanceKey = `${componentName}_${Date.now()}`;
            this.components.set(instanceKey, element);
            
            return element;
        } catch (error) {
            console.error(`Failed to render component '${componentName}':`, error);
            throw error;
        }
    }

    /**
     * 创建完整的应用布局
     * @param {HTMLElement|string} container - 容器
     * @param {Object} options - 配置选项
     * @returns {Promise<LayoutComponent>} 布局组件实例
     */
    async createLayout(container, options = {}) {
        const {
            activeNav = 'drafts',
            activeCategory = 'all',
            categories = [],
            content = '<div id="posts-container"><div class="loading">正在加载文章列表...</div></div>'
        } = options;

        try {
            const layoutElement = await this.render('layout', container, {
                activeNav,
                activeCategory,
                categories,
                content
            });

            const layoutInstance = layoutElement._layoutInstance;
            
            // 设置默认内容
            if (content) {
                layoutInstance.updateMainContent(content);
            }

            return layoutInstance;
        } catch (error) {
            console.error('Failed to create layout:', error);
            throw error;
        }
    }

    /**
     * 获取组件加载器
     * @returns {ComponentLoader} 组件加载器实例
     */
    getLoader() {
        return this.loader;
    }

    /**
     * 卸载组件
     * @param {string} componentName - 组件名称
     */
    unload(componentName) {
        this.loader.unload(componentName);
        
        // 清理存储的实例引用
        for (const [key, element] of this.components.entries()) {
            if (key.startsWith(componentName)) {
                this.components.delete(key);
            }
        }
    }

    /**
     * 重新加载组件
     * @param {string} componentName - 组件名称
     */
    async reload(componentName) {
        await this.loader.reload(componentName);
    }

    /**
     * 获取已加载的组件列表
     * @returns {Array<string>} 组件名称列表
     */
    getLoadedComponents() {
        return this.loader.getLoadedComponents();
    }

    /**
     * 销毁组件管理器
     */
    destroy() {
        // 卸载所有组件
        const loadedComponents = this.getLoadedComponents();
        loadedComponents.forEach(componentName => {
            this.unload(componentName);
        });

        // 清理引用
        this.components.clear();
        this.initialized = false;
    }
}

// 创建全局组件管理器实例
const componentManager = new ComponentManager();

// 导出组件类和管理器
export {
    ComponentManager,
    NavigationComponent,
    CategoryTabsComponent,
    LayoutComponent,
    componentLoader
};

export default componentManager;