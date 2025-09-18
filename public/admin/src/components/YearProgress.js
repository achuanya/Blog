/**
 * 年度进度条组件控制器
 */
import componentLoader from './ComponentLoader.js';

class YearProgressComponent {
    constructor() {
        this.yearProgress = 0;
        this.updateInterval = null;
        this.isInitialized = false;
    }

    /**
     * 初始化年度进度条组件
     * @param {HTMLElement} element - 组件根元素
     * @param {Object} props - 组件属性
     */
    async init(element, props = {}) {
        this.element = element;
        this.props = props;
        
        // 计算并设置初始进度
        this.calculateYearProgress();
        
        // 渲染组件
        this.render();
        
        // 绑定事件
        this.bindEvents();
        
        // 设置自动更新
        this.startAutoUpdate();
        
        this.isInitialized = true;
    }

    /**
     * 计算年度进度
     */
    calculateYearProgress() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
        
        // 计算总天数和已过天数
        const totalDays = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
        const daysPassed = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
        
        // 计算进度百分比并四舍五入
        this.yearProgress = Math.round((daysPassed / totalDays) * 100);
        
        // 确保进度在0-100范围内
        this.yearProgress = Math.max(0, Math.min(100, this.yearProgress));
    }

    /**
     * 渲染组件
     */
    render() {
        if (!this.element) return;

        const progressFill = this.element.querySelector('#progress-fill');
        const progressLabel = this.element.querySelector('#progress-label');
        
        if (progressFill) {
            // 先重置宽度为0，然后触发动画
            progressFill.style.width = '0%';
            
            // 使用requestAnimationFrame确保动画效果
            requestAnimationFrame(() => {
                progressFill.style.width = `${this.yearProgress}%`;
            });
            
            // 设置进度标签位置
            if (progressLabel) {
                progressLabel.style.left = `${this.yearProgress}%`;
                progressLabel.textContent = `${this.yearProgress}%`;
                
                // 在动画完成后自动显示数字2秒然后淡出
                setTimeout(() => {
                    this.showProgressLabel();
                    
                    // 2秒后淡出
                    setTimeout(() => {
                        this.hideProgressLabel();
                    }, 2000);
                }, 2000); // 等待动画完成（2秒）
            }
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        if (!this.element) return;

        const container = this.element.querySelector('.year-progress-container');
        if (container) {
            // 鼠标悬停显示百分比
            container.addEventListener('mouseenter', () => {
                this.showProgressLabel();
            });
            
            container.addEventListener('mouseleave', () => {
                this.hideProgressLabel();
            });
        }
    }

    /**
     * 显示进度标签
     */
    showProgressLabel() {
        const progressLabel = this.element?.querySelector('#progress-label');
        if (progressLabel) {
            progressLabel.style.opacity = '1';
        }
    }

    /**
     * 隐藏进度标签
     */
    hideProgressLabel() {
        const progressLabel = this.element?.querySelector('#progress-label');
        if (progressLabel) {
            progressLabel.style.opacity = '0';
        }
    }

    /**
     * 开始自动更新
     */
    startAutoUpdate() {
        // 每24小时更新一次
        this.updateInterval = setInterval(() => {
            this.calculateYearProgress();
            this.render();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * 停止自动更新
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * 手动更新进度
     */
    updateProgress() {
        this.calculateYearProgress();
        this.render();
    }

    /**
     * 获取当前进度
     * @returns {number} 当前年度进度百分比
     */
    getProgress() {
        return this.yearProgress;
    }

    /**
     * 获取剩余天数
     * @returns {number} 年度剩余天数
     */
    getRemainingDays() {
        const now = new Date();
        const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
        const remainingMs = endOfYear.getTime() - now.getTime();
        return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    }

    /**
     * 销毁组件
     */
    destroy() {
        this.stopAutoUpdate();
        
        if (this.element) {
            // 移除事件监听器
            const container = this.element.querySelector('.year-progress-container');
            if (container) {
                container.removeEventListener('mouseenter', this.showProgressLabel);
                container.removeEventListener('mouseleave', this.hideProgressLabel);
            }
        }
        
        this.element = null;
        this.isInitialized = false;
    }
}

// 注册组件
componentLoader.register(
    'year-progress',
    'src/components/YearProgress.html',
    async (element, props) => {
        const instance = new YearProgressComponent();
        await instance.init(element, props);
        element._yearProgressInstance = instance;
        return instance;
    }
);

export default YearProgressComponent;
export { YearProgressComponent };