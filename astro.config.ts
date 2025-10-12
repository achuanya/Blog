import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// 官方文档: https://astro.build/config
export default defineConfig({
  site: SITE.website,
  
  // 尾部斜杠
  // "ignore" - 保持原样
  // "always" - 总是添加
  // "never" - 总是移除
  trailingSlash: "ignore",
  
  // 集成插件
  integrations: [
    // MDX 支持
    mdx({
      remarkPlugins: [remarkMath], 
      rehypePlugins: [rehypeKatex],
    }),
    
    sitemap({
      // 决定哪些页面包含在站点地图中
      // 如果不显示归档页面，则排除 /archives
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
  ],
  
  // Markdown 文件处理
  markdown: {
    remarkPlugins: [
      remarkToc, 
      // 可折叠的目录区块
      [remarkCollapse, { test: "Table of contents" }], 
    ],
    
    // Shiki 代码高亮
    shikiConfig: {
      // 代码主题配置
      themes: { 
        // 浅色主题
        light: "min-light", 
        // 深色主题
        dark: "night-owl"  
      },
      
      // 不使用默认颜色，而是使用主题定义的颜色
      defaultColor: false,
      
      // 不自动换行
      wrap: false,
      
      // 代码转换器配置
      transformers: [
        // 显示文件名
        transformerFileName({ style: "v2", hideDot: false }),              
        // 高亮指定行
        transformerNotationHighlight(),
        // 高亮指定词汇
        transformerNotationWordHighlight(),
        // 显示代码差异
        transformerNotationDiff({ matchAlgorithm: "v3" }), 
      ],
    },
  },
  // Vite 构建工具
  vite: {
    // Tailwind CSS 支持
    plugins: [tailwindcss()], 
    
    // 依赖优化
    optimizeDeps: {
      // 排除不需要预构建的依赖
      exclude: ["@resvg/resvg-js"], 
    },
    
    // 开发服务器
    server: {
      // 允许的主机名
      allowedHosts: ["lhasa.icu"],
      // 允许外部设备访问
      host: "0.0.0.0",
    },
    
    // 全局常量
    define: {
      // 图片资源 CDN 地址
      IMAGES: JSON.stringify("https://cos.lhasa.icu/ArticlePictures"),
      // EXIF 数据 API 地址
      EXIF: JSON.stringify("https://lhasa-1253887673.cos.ap-shanghai.myqcloud.com/ArticlePictures"),
    },
  },
  // 图片处理
  image: {
    // 启用响应式样式
    responsiveStyles: true,
    // 图片布局模式
    layout: "constrained", // 约束布局，保持宽高比
  },
  
  // 环境变量
  env: {
    schema: {
      // Google 站点验证公钥
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",    // 公开访问
        context: "client",   // 客户端可用
        optional: true,      // 可选
      }),
    },
  },
  
  // 实验性功能
  experimental: {
    // 保持脚本执行顺序
    preserveScriptOrder: true,
  },
});