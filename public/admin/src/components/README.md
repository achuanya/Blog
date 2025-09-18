# 博客管理系统组件化架构

本项目已经将 `index.html` 中的各个部件拆分成独立的可复用组件。

## 组件结构

```
src/components/
├── ComponentLoader.js    # 组件加载器核心
├── Navigation.html       # 导航菜单模板
├── Navigation.js         # 导航菜单控制器
├── CategoryTabs.html     # 分类标签模板
├── CategoryTabs.js       # 分类标签控制器
├── Layout.html           # 页面布局模板
├── Layout.js             # 页面布局控制器
├── index.js              # 组件管理器
└── README.md             # 本文档
```

## 核心特性

### 1. 组件加载器 (ComponentLoader)
- 动态加载HTML模板
- 模板插值支持
- 组件生命周期管理
- 缓存机制

### 2. 导航组件 (Navigation)
- 响应式导航菜单
- 活跃状态管理
- 自定义事件触发
- 移动端菜单支持

### 3. 分类标签组件 (CategoryTabs)
- 动态分类渲染
- 分类切换事件
- 分类数据管理
- 响应式布局

### 4. 布局组件 (Layout)
- 统一页面布局
- 子组件管理
- 事件协调
- 内容区域管理

## 使用方法

### 基本使用

```javascript
import componentManager from './src/components/index.js';

// 初始化组件管理器
await componentManager.init();

// 创建完整布局
const layout = await componentManager.createLayout('#app-container', {
  activeNav: 'drafts',
  activeCategory: 'all',
  categories: [
    { slug: 'tech', name: '技术' },
    { slug: 'life', name: '生活' }
  ]
});
```

### 单独使用组件

```javascript
import componentLoader from './src/components/ComponentLoader.js';

// 渲染导航组件
const navElement = await componentLoader.render(
  'navigation',
  '#nav-container',
  { activeNav: 'technology' }
);

// 渲染分类标签
const tabsElement = await componentLoader.render(
  'category-tabs',
  '#tabs-container',
  {
    categories: [{ slug: 'tech', name: '技术' }],
    activeCategory: 'tech'
  }
);
```

### 事件监听

```javascript
// 监听导航变更
document.addEventListener('layout-navigation-change', (e) => {
  const { navType } = e.detail;
  console.log('导航切换到:', navType);
});

// 监听分类变更
document.addEventListener('layout-category-change', (e) => {
  const { category, categoryData } = e.detail;
  console.log('分类切换到:', category);
});
```

### 动态更新

```javascript
// 更新分类列表
layout.updateCategories([
  { slug: 'new-category', name: '新分类' }
]);

// 切换导航
layout.setNavigation('technology');

// 切换分类
layout.setCategory('new-category');

// 更新主内容
layout.updateMainContent('<div>新内容</div>');
```

## 组件API

### ComponentLoader

- `register(name, templatePath, initFunction)` - 注册组件
- `render(name, container, props)` - 渲染组件
- `unload(name)` - 卸载组件
- `reload(name)` - 重新加载组件

### NavigationComponent

- `setActiveNav(navType)` - 设置活跃导航
- `getCurrentNav()` - 获取当前导航
- `setNav(navType)` - 程序化设置导航

### CategoryTabsComponent

- `setActiveCategory(category)` - 设置活跃分类
- `updateCategories(categories)` - 更新分类列表
- `addCategory(category)` - 添加分类
- `removeCategory(categorySlug)` - 移除分类
- `getActiveCategory()` - 获取当前分类

### LayoutComponent

- `updateMainContent(content)` - 更新主内容
- `setNavigation(navType)` - 设置导航状态
- `setCategory(category)` - 设置分类状态
- `updateCategories(categories)` - 更新分类列表
- `setCategoryTabsVisible(visible)` - 显示/隐藏分类标签
- `setNavigationVisible(visible)` - 显示/隐藏导航
- `getCurrentState()` - 获取当前状态

## 自定义事件

### 导航事件
- `navigation-change` - 导航项点击
- `layout-navigation-change` - 布局级导航变更
- `menu-toggle` - 菜单切换

### 分类事件
- `category-change` - 分类标签点击
- `layout-category-change` - 布局级分类变更

## 模板语法

组件模板支持简单的插值语法：

```html
<!-- 在模板中使用 {{变量名}} -->
<div class="{{className}}">{{content}}</div>
```

在渲染时传入对应的属性：

```javascript
await componentLoader.render('my-component', container, {
  className: 'active',
  content: 'Hello World'
});
```

## 降级处理

如果组件系统初始化失败，应用会自动降级到原始的HTML结构，确保基本功能可用。

## 扩展组件

要创建新的组件：

1. 创建HTML模板文件
2. 创建JavaScript控制器
3. 在控制器中注册组件
4. 在需要的地方导入并使用

```javascript
// MyComponent.js
import componentLoader from './ComponentLoader.js';

class MyComponent {
  async init(element, props) {
    // 组件初始化逻辑
  }
}

// 注册组件
componentLoader.register(
  'my-component',
  'src/components/MyComponent.html',
  async (element, props) => {
    const instance = new MyComponent();
    await instance.init(element, props);
    return instance;
  }
);
```

## 注意事项

1. 组件模板文件需要通过HTTP服务器访问，不能直接用file://协议
2. 组件实例会存储在DOM元素的`_componentInstance`属性中
3. 组件卸载时会自动清理事件监听器
4. 建议在组件销毁时调用相应的destroy方法