export const SITE = {
  website: "https://lhasa.icu/",
  author: "游钓四方",
  profile: "https://github.com/achuanya",
  desc: "骑过湖边的小径，走过文字里的角落，偶尔停下，看见风，也看见自己",
  title: "游钓四方",
  
  ogImage: "https://cos.lhasa.icu/StylePictures/my-photo.jpg",
  notFoundImage: "https://cos.lhasa.icu/StylePictures/404.gif",
  notFoundStaticImage: "https://cos.lhasa.icu/StylePictures/404.webp",
  logo: "https://cos.lhasa.icu/StylePictures/apple-touch-icon.png",
  
  // 功能配置
  lightAndDarkMode: true,    // 主题切换
  showArchives: true,        // 归档
  showBackButton: true,      // 返回按钮
  dynamicOgImage: false,     // OG图片
  
  // 分页配置
  postPerIndex: 12,          // 初始显示文章数量
  postPerPage: 12,           // 每次加载文章数量
  
  // Sports 独立分页配置
  sports: {
    postPerPage: 12,
  },
  
  // Archives 懒加载配置
  archives: {
    enableLazyLoad: true,     // 启用懒加载
    initialYearsToShow: 1,    // 初始显示年份数量
    yearsPerPage: 1,          // 每次加载年份数量
  },
  
  // 定时发布配置
  scheduledPostMargin: 15 * 60 * 1000,
  
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/achuanya/lhasa/edit/main/",
  },
  
  // 本地化配置
  dir: "ltr",
  lang: "zh-CN",
  timezone: "Asia/Shanghai",
} as const;