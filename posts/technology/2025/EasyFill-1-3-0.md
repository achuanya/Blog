---
author: 游钓四方
draft: false
featured: false
category: technology
pubDatetime: 2025-09-18T08:44+08:00
title: EasyFill v1.3 发布：支持SPA机制、优化 Shadow DOM 遍历逻辑
slug: EasyFill-1-3-0
ogImage: https://cos.lhasa.icu/ArticlePictures/EasyFill-1-3-0/EasyFill128.webp_81
tags:
  - EasyFill
  - 扩展
  - 开源
  - 独立开发者
description: 本次更新（commit:7764aa3） 对 content.ts 文件进行了部分重构
---

本次更新（commit: 7764aa3） 对 `content.ts` 文件进行了部分重构，详情如下：

- 重构 Shadow DOM 遍历逻辑，使用 WeakSet 避免重复遍历
- 新增页面变化检测机制，完美支持 PJAX/AJAX/SPA 等现代页面刷新方式
- 新增两段填充：DOM 加载前后，提升容错

### Shadow DOM 遍历优化

```typescript file="entrypoints/content.ts"
const processedShadowRoots = new WeakSet<ShadowRoot>();

function traverseShadowDOM(root: Document | ShadowRoot | Element) {
  // 如果 ShadowRoot 已经处理过，跳过
  if (root instanceof ShadowRoot && processedShadowRoots.has(root)) {
    return;
  }
  
  // 标记已处理的 ShadowRoot
  if (root instanceof ShadowRoot) {
    processedShadowRoots.add(root);
  }
}
```


### 页面变化检测机制

```typescript file="entrypoints/content.ts"
function setupAdvancedPageChangeDetection() {
  // 监听浏览器前进后退
  window.addEventListener('popstate', () => {
    logger.info('检测到 popstate 事件');
    handlePageChange();
  });

  // 监听 PJAX、AJAX
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    logger.info('检测到 pushState 事件');
    setTimeout(() => handlePageChange(), 100);
  };

  // 监听 hashchange 事件
  window.addEventListener('hashchange', () => {
    logger.info('检测到 hashchange 事件');
    handlePageChange();
  });

  // DOM 变化检测
  const observer = new MutationObserver((mutations) => {
    if (fillState.isAutoFillStopped && !fillState.pageChangeDetected) {
      let significantChanges = 0;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // 检查大量节点变化
          if (mutation.addedNodes.length > 5 || mutation.removedNodes.length > 5) {
            significantChanges++;
          }
          
          // 检查结构性变化
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              if (node.matches('form, input, textarea') || 
                  node.querySelector('form, input, textarea')) {
                significantChanges += 2;
              }
              
              if (node.matches('main, article, section, .content, #content, .main, #main')) {
                significantChanges += 3;
              }
            }
          });
        }
      });
      
      // 判断是否为页面内容更新
      if (significantChanges >= 3) {
        logger.info(`检测到DOM变化 (${significantChanges}个变化点)`);
        
        if (detectPageChange()) {
          fillState.pageChangeDetected = true;
          handlePageChange();
        }
      }
    }
  });

  setInterval(() => {
    if (detectPageChange()) {
      handlePageChange();
    }
  }, 2000);
}
```

### 两段填充

```typescript file="entrypoints/content.ts"
async function executeFirstFill() {
  if (fillState.isFirstFillCompleted) {
    return;
  }
  
  await performFill('首次');
  fillState.isFirstFillCompleted = true;
  logger.info('首次填充已完成');
}

async function executeSecondFill() {
  if (fillState.isSecondFillCompleted) {
    return;
  }
  
  await performFill('第二次');
  fillState.isSecondFillCompleted = true;
  fillState.isAutoFillStopped = true;
  logger.info('第二次填充已完成，自动填充已停止');
}
```

## 立即体验

**EasyFill v1.3** 已正式发布：

- **新用户**：Chrome Web Store 搜索 "[EasyFill](https://chromewebstore.google.com/detail/eamchegekphehbmebccbapnihegngobm?utm_source=item-share-cb)" 安装
- **现有用户**：魔法联网后 Chrome 扩展将自动更新到最新版本
- **开发者**：访问 [github.com/achuanya/EasyFill](https://github.com/achuanya/EasyFill) 查看源代码
- **大陆访问**：[点此下载 Easyfill-1.3.0-chrome.zip](https://cos.lhasa.icu/EasyFill/Version/easyfill-1.3.0-chrome.zip)

安装方式也很简单：下载后解压到文件夹，进入 **Chrome → 管理扩展程序 → 加载未打包的扩展**，选择解压目录即可。其他基于 Chromium 内核的浏览器同样适用。

**EasyFill - 简易填充，让每一次评论更自然，与你的博友互动无缝连接**
