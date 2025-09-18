/**
 * 全局颜色管理
 * 集中管理项目中使用的所有颜色变量
 */

// 主题色彩
export const colors = {
  // 主要颜色
  primary: {
    blue: 'rgb(125, 185, 222)',
    lightBlue: '#7db9de',
  },
  
  // 背景色
  background: {
    white: '#ffffff',
    gray: '#e7e7eb',
    lightGray: '#f5f5f5',
  },
  
  // 文本色
  text: {
    primary: '#000000',
    secondary: '#666666',
    muted: '#888888',
  },
  
  // 状态色
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // 边框色
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },
};

// 主题颜色配置
export const themeColors = {
  progressFill: colors.primary.blue,        // 进度条填充色
  progressBackground: colors.background.gray, // 进度条背景色
  pageBackground: colors.primary.lightBlue,   // 页面背景色
  cardBackground: colors.background.white,    // 卡片背景色
  progressText: colors.text.primary,          // 进度文字颜色
};

// CSS 变量映射
export const cssVariables = {
  '--progress-fill': themeColors.progressFill,
  '--progress-bg': themeColors.progressBackground,
  '--progress-text': themeColors.progressText,
};

/**
 * 应用CSS变量到元素
 * @param {HTMLElement} element - 目标元素
 * @param {Object} variables - CSS变量对象
 */
export function applyCSSVariables(element, variables = cssVariables) {
  if (!element) return;
  
  Object.entries(variables).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * 获取主题颜色
 * @param {string} colorKey - 颜色键名
 * @returns {string} 颜色值
 */
export function getThemeColor(colorKey) {
  return themeColors[colorKey] || colors.primary.blue;
}

export default {
  colors,
  themeColors,
  cssVariables,
  applyCSSVariables,
  getThemeColor,
};