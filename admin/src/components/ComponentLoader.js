/**
 * 组件加载器 - 负责动态加载和管理HTML组件
 */
class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.loadedComponents = new Set();
    }

    /**
     * 注册组件
     * @param {string} name - 组件名称
     * @param {string} templatePath - 模板文件路径
     * @param {Function} initFunction - 初始化函数
     */
    register(name, templatePath, initFunction = null) {
        this.components.set(name, {
            templatePath,
            initFunction,
            template: null
        });
    }

    /**
     * 加载组件模板
     * @param {string} name - 组件名称
     * @returns {Promise<string>} 组件HTML模板
     */
    async loadTemplate(name) {
        if (!this.components.has(name)) {
            throw new Error(`Component '${name}' not registered`);
        }

        const component = this.components.get(name);
        
        if (component.template) {
            return component.template;
        }

        try {
            const response = await fetch(component.templatePath);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.statusText}`);
            }
            component.template = await response.text();
            return component.template;
        } catch (error) {
            console.error(`Error loading component '${name}':`, error);
            throw error;
        }
    }

    /**
     * 渲染组件到指定容器
     * @param {string} name - 组件名称
     * @param {HTMLElement|string} container - 容器元素或选择器
     * @param {Object} props - 组件属性
     * @returns {Promise<HTMLElement>} 渲染后的组件元素
     */
    async render(name, container, props = {}) {
        const template = await this.loadTemplate(name);
        
        // 获取容器元素
        const containerElement = typeof container === 'string' 
            ? document.querySelector(container)
            : container;
            
        if (!containerElement) {
            throw new Error('Container element not found');
        }

        // 创建组件元素
        const componentElement = document.createElement('div');
        componentElement.className = `component-${name}`;
        componentElement.innerHTML = this.interpolateTemplate(template, props);

        // 清空容器并添加组件
        containerElement.innerHTML = '';
        containerElement.appendChild(componentElement);

        // 执行初始化函数
        const component = this.components.get(name);
        if (component.initFunction) {
            await component.initFunction(componentElement, props);
        }

        this.loadedComponents.add(name);
        return componentElement;
    }

    /**
     * 模板插值处理
     * @param {string} template - 模板字符串
     * @param {Object} props - 属性对象
     * @returns {string} 处理后的模板
     */
    interpolateTemplate(template, props) {
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return props[key] !== undefined ? props[key] : match;
        });
    }

    /**
     * 卸载组件
     * @param {string} name - 组件名称
     */
    unload(name) {
        const elements = document.querySelectorAll(`.component-${name}`);
        elements.forEach(el => el.remove());
        this.loadedComponents.delete(name);
    }

    /**
     * 获取已加载的组件列表
     * @returns {Array<string>} 组件名称列表
     */
    getLoadedComponents() {
        return Array.from(this.loadedComponents);
    }

    /**
     * 重新加载组件
     * @param {string} name - 组件名称
     */
    async reload(name) {
        if (this.components.has(name)) {
            // 清除缓存的模板
            this.components.get(name).template = null;
            this.loadedComponents.delete(name);
        }
    }
}

// 创建全局组件加载器实例
const componentLoader = new ComponentLoader();

export default componentLoader;
export { ComponentLoader };