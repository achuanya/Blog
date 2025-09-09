/**
 * 导航组件控制器
 */
import componentLoader from './ComponentLoader.js';

class NavigationComponent {
    constructor() {
        this.currentNav = 'drafts';
        this.navigationItems = [
            'drafts', 'all', 'life', 'sports', 'startup', 'technology', 'new', 'search', 'settings'
        ];
    }

    /**
     * 初始化导航组件
     * @param {HTMLElement} element - 组件根元素
     * @param {Object} props - 组件属性
     */
    async init(element, props = {}) {
        this.element = element;
        this.currentNav = props.activeNav || 'drafts';
        
        // 绑定事件
        this.bindEvents();
        
        // 设置初始状态
        this.setActiveNav(this.currentNav);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        if (!this.element) return;

        // 导航项点击事件
        const navItems = this.element.querySelectorAll('.navigation-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const navType = item.dataset.nav;
                if (navType) {
                    this.handleNavClick(navType);
                }
            });
        });

        // 菜单切换事件
        const menuToggle = this.element.querySelector('#menu');
        if (menuToggle) {
            menuToggle.addEventListener('change', (e) => {
                this.handleMenuToggle(e.target.checked);
            });
        }
    }

    /**
     * 处理导航点击
     * @param {string} navType - 导航类型
     */
    handleNavClick(navType) {
        this.setActiveNav(navType);
        
        // 触发自定义事件
        const event = new CustomEvent('navigation-change', {
            detail: { navType, previousNav: this.currentNav }
        });
        document.dispatchEvent(event);
        
        this.currentNav = navType;
        
        // 关闭移动端菜单
        const menuToggle = this.element.querySelector('#menu');
        if (menuToggle) {
            menuToggle.checked = false;
        }
    }

    /**
     * 设置活跃导航项
     * @param {string} navType - 导航类型
     */
    setActiveNav(navType) {
        if (!this.element) return;

        // 移除所有活跃状态
        const navItems = this.element.querySelectorAll('.navigation-item');
        navItems.forEach(item => {
            item.classList.remove('current');
        });

        // 设置当前活跃项
        const activeItem = this.element.querySelector(`[data-nav="${navType}"]`);
        if (activeItem) {
            activeItem.classList.add('current');
        }
    }

    /**
     * 处理菜单切换
     * @param {boolean} isOpen - 菜单是否打开
     */
    handleMenuToggle(isOpen) {
        // 触发菜单切换事件
        const event = new CustomEvent('menu-toggle', {
            detail: { isOpen }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前活跃导航
     * @returns {string} 当前导航类型
     */
    getCurrentNav() {
        return this.currentNav;
    }

    /**
     * 程序化设置导航
     * @param {string} navType - 导航类型
     */
    setNav(navType) {
        if (this.navigationItems.includes(navType)) {
            this.handleNavClick(navType);
        }
    }

    /**
     * 销毁组件
     */
    destroy() {
        // 移除事件监听器
        if (this.element) {
            const navItems = this.element.querySelectorAll('.navigation-item');
            navItems.forEach(item => {
                item.replaceWith(item.cloneNode(true));
            });
        }
    }
}

// 注册导航组件
componentLoader.register(
    'navigation',
    'src/components/Navigation.html',
    async (element, props) => {
        const navigation = new NavigationComponent();
        await navigation.init(element, props);
        
        // 将实例存储到元素上，便于外部访问
        element._navigationInstance = navigation;
        
        return navigation;
    }
);

export default NavigationComponent;
export { NavigationComponent };